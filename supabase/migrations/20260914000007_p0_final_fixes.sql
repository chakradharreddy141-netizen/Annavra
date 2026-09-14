-- Final P0 Hardening Fixes (Concurrency, Validation, Ownership)

-- 1. Atomic Rate Limiting via Buckets
CREATE TABLE IF NOT EXISTS public.scan_buckets (
    user_id UUID NOT NULL,
    hour_bucket TIMESTAMP NOT NULL,
    scan_count INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (user_id, hour_bucket)
);
ALTER TABLE public.scan_buckets ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION check_and_increment_scan_rate_limit()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_current_hour TIMESTAMP;
    v_count INTEGER;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RETURN FALSE; END IF;

    v_current_hour := date_trunc('hour', NOW());

    -- Atomic Upsert & Increment
    INSERT INTO public.scan_buckets (user_id, hour_bucket, scan_count)
    VALUES (v_user_id, v_current_hour, 1)
    ON CONFLICT (user_id, hour_bucket) 
    DO UPDATE SET scan_count = scan_buckets.scan_count + 1
    RETURNING scan_count INTO v_count;

    IF v_count > 20 THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$;


-- 2. Concurrency-Safe Meal Logging
CREATE OR REPLACE FUNCTION log_meal_transaction(
    p_operation_id UUID,
    p_date DATE,
    p_meal_name TEXT,
    p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_meal_id UUID;
    v_payload_hash TEXT;
    v_existing_hash TEXT;
    v_total_cal NUMERIC(7,1) := 0;
    v_total_pro NUMERIC(6,1) := 0;
    v_total_car NUMERIC(6,1) := 0;
    v_total_fat NUMERIC(6,1) := 0;
    v_total_fib NUMERIC(6,1) := 0;
    item JSONB;
    v_item_cal NUMERIC;
    v_item_pro NUMERIC;
    v_item_car NUMERIC;
    v_item_fat NUMERIC;
    v_item_fib NUMERIC;
    v_item_qty NUMERIC;
    v_meal_number INTEGER;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Validate payload
    IF p_items IS NULL OR jsonb_typeof(p_items) != 'array' OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Meal items must be a non-empty array';
    END IF;

    -- Generate canonical payload hash (sort array to guarantee stability)
    v_payload_hash := md5(
        p_date::TEXT || 
        p_meal_name || 
        (SELECT jsonb_agg(value) FROM (SELECT value FROM jsonb_array_elements(p_items) ORDER BY value->>'food_name') s)::TEXT
    );

    -- Meal Number Lock: Serialize access for this user+date combo
    PERFORM pg_advisory_xact_lock(hashtext(v_user_id::text || p_date::text));

    SELECT COALESCE(MAX(meal_number), 0) + 1 INTO v_meal_number
    FROM public.meals
    WHERE user_id = v_user_id AND date = p_date;

    -- Calculate Totals
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_item_qty := COALESCE((item->>'quantity')::NUMERIC, 1);
        v_item_cal := COALESCE((item->>'calories')::NUMERIC, 0);
        v_item_pro := COALESCE((item->>'protein_g')::NUMERIC, 0);
        v_item_car := COALESCE((item->>'carbs_g')::NUMERIC, 0);
        v_item_fat := COALESCE((item->>'fat_g')::NUMERIC, 0);
        v_item_fib := COALESCE((item->>'fiber_g')::NUMERIC, 0);

        IF v_item_qty <= 0 OR v_item_cal < 0 OR v_item_pro < 0 OR v_item_car < 0 OR v_item_fat < 0 OR v_item_fib < 0 THEN
            RAISE EXCEPTION 'Nutrition values must be non-negative, quantity must be > 0';
        END IF;

        v_total_cal := v_total_cal + (v_item_cal * v_item_qty);
        v_total_pro := v_total_pro + (v_item_pro * v_item_qty);
        v_total_car := v_total_car + (v_item_car * v_item_qty);
        v_total_fat := v_total_fat + (v_item_fat * v_item_qty);
        v_total_fib := v_total_fib + (v_item_fib * v_item_qty);
    END LOOP;

    -- Atomic Insert
    INSERT INTO public.meals (
        user_id, date, meal_number, meal_name, total_calories, total_protein_g, total_carbs_g, total_fat_g, total_fiber_g, operation_id, payload_hash
    ) VALUES (
        v_user_id, p_date, v_meal_number, p_meal_name, v_total_cal, v_total_pro, v_total_car, v_total_fat, v_total_fib, p_operation_id, v_payload_hash
    ) ON CONFLICT (user_id, operation_id) DO NOTHING
    RETURNING id INTO v_meal_id;

    -- Handle Conflict
    IF v_meal_id IS NULL THEN
        SELECT id, payload_hash INTO v_meal_id, v_existing_hash
        FROM public.meals
        WHERE user_id = v_user_id AND operation_id = p_operation_id;
        
        IF v_existing_hash != v_payload_hash THEN
            RAISE EXCEPTION 'IDEMPOTENCY_KEY_REUSED_MISMATCH';
        END IF;
        
        RETURN jsonb_build_object('created', false, 'already_exists', true, 'id', v_meal_id);
    END IF;

    -- Insert Items
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.meal_items (
            meal_id, user_id, food_name, quantity, unit, calories, protein_g, carbs_g, fat_g, fiber_g, nutrition_source
        ) VALUES (
            v_meal_id, v_user_id, item->>'food_name', COALESCE((item->>'quantity')::NUMERIC, 1), COALESCE(item->>'unit', 'serving'),
            COALESCE((item->>'calories')::NUMERIC, 0), COALESCE((item->>'protein_g')::NUMERIC, 0), COALESCE((item->>'carbs_g')::NUMERIC, 0),
            COALESCE((item->>'fat_g')::NUMERIC, 0), COALESCE((item->>'fiber_g')::NUMERIC, 0), COALESCE(item->>'nutrition_source', 'user_entered')
        );
    END LOOP;

    PERFORM recalculate_daily_summary(p_date);
    RETURN jsonb_build_object('created', true, 'already_exists', false, 'id', v_meal_id);
END;
$$;


-- 3. Concurrency-Safe Workout Logging (with ownership validation)
CREATE OR REPLACE FUNCTION log_workout_transaction(
    p_operation_id UUID,
    p_date DATE,
    p_workout_type TEXT,
    p_name TEXT,
    p_duration_minutes INTEGER,
    p_notes TEXT,
    p_sets JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_workout_id UUID;
    v_payload_hash TEXT;
    v_existing_hash TEXT;
    set_item JSONB;
    v_exercise_id UUID;
    v_exercise_owner UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Validate payload
    IF p_sets IS NOT NULL AND jsonb_typeof(p_sets) = 'array' THEN
        -- Generate canonical hash
        v_payload_hash := md5(
            p_date::TEXT || p_workout_type || p_name || COALESCE(p_duration_minutes::TEXT, '') || COALESCE(p_notes, '') || 
            (SELECT jsonb_agg(value) FROM (SELECT value FROM jsonb_array_elements(p_sets) ORDER BY value->>'exercise_id', (value->>'set_number')::INT) s)::TEXT
        );
    ELSE
        v_payload_hash := md5(p_date::TEXT || p_workout_type || p_name || COALESCE(p_duration_minutes::TEXT, '') || COALESCE(p_notes, ''));
    END IF;

    -- Atomic Insert
    INSERT INTO public.workouts (
        user_id, date, workout_type, name, duration_minutes, notes, operation_id, payload_hash
    ) VALUES (
        v_user_id, p_date, p_workout_type, p_name, p_duration_minutes, p_notes, p_operation_id, v_payload_hash
    ) ON CONFLICT (user_id, operation_id) DO NOTHING
    RETURNING id INTO v_workout_id;

    -- Handle Conflict
    IF v_workout_id IS NULL THEN
        SELECT id, payload_hash INTO v_workout_id, v_existing_hash
        FROM public.workouts
        WHERE user_id = v_user_id AND operation_id = p_operation_id;
        
        IF v_existing_hash != v_payload_hash THEN
            RAISE EXCEPTION 'IDEMPOTENCY_KEY_REUSED_MISMATCH';
        END IF;
        
        RETURN jsonb_build_object('created', false, 'already_exists', true, 'id', v_workout_id);
    END IF;

    -- Validate Ownership and Insert Sets
    IF p_sets IS NOT NULL AND jsonb_typeof(p_sets) = 'array' THEN
        FOR set_item IN SELECT * FROM jsonb_array_elements(p_sets)
        LOOP
            v_exercise_id := (set_item->>'exercise_id')::UUID;
            
            -- Strict Ownership Boundary
            SELECT user_id INTO v_exercise_owner FROM public.exercises WHERE id = v_exercise_id;
            IF NOT FOUND THEN
                RAISE EXCEPTION 'Exercise % not found', v_exercise_id;
            END IF;
            IF v_exercise_owner IS NOT NULL AND v_exercise_owner != v_user_id THEN
                RAISE EXCEPTION 'Unauthorized: exercise % belongs to another user', v_exercise_id;
            END IF;

            INSERT INTO public.workout_sets (
                workout_id, user_id, exercise_id, set_number, reps, weight_kg, is_pr, notes, rest_seconds
            ) VALUES (
                v_workout_id, v_user_id, v_exercise_id,
                (set_item->>'set_number')::INTEGER, (set_item->>'reps')::INTEGER, (set_item->>'weight_kg')::NUMERIC,
                COALESCE((set_item->>'is_pr')::BOOLEAN, FALSE), set_item->>'notes', (set_item->>'rest_seconds')::INTEGER
            );
        END LOOP;
    END IF;

    PERFORM recalculate_daily_summary(p_date);
    RETURN jsonb_build_object('created', true, 'already_exists', false, 'id', v_workout_id);
END;
$$;
