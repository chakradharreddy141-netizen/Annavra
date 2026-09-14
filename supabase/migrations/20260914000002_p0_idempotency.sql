-- P0 Idempotency Migration
-- Addresses idempotency keys and retry handling for critical write operations

-- 1. Add operation_id and payload_hash to meals
ALTER TABLE public.meals ADD COLUMN operation_id UUID;
ALTER TABLE public.meals ADD COLUMN payload_hash TEXT;

-- Backfill existing meals
UPDATE public.meals SET operation_id = gen_random_uuid() WHERE operation_id IS NULL;

-- Enforce NOT NULL and UNIQUE constraint
ALTER TABLE public.meals ALTER COLUMN operation_id SET NOT NULL;
ALTER TABLE public.meals ADD CONSTRAINT meals_user_operation_unique UNIQUE(user_id, operation_id);

-- 2. Add operation_id and payload_hash to workouts
ALTER TABLE public.workouts ADD COLUMN operation_id UUID;
ALTER TABLE public.workouts ADD COLUMN payload_hash TEXT;

-- Backfill existing workouts
UPDATE public.workouts SET operation_id = gen_random_uuid() WHERE operation_id IS NULL;

-- Enforce NOT NULL and UNIQUE constraint
ALTER TABLE public.workouts ALTER COLUMN operation_id SET NOT NULL;
ALTER TABLE public.workouts ADD CONSTRAINT workouts_user_operation_unique UNIQUE(user_id, operation_id);

-- 3. Update log_meal_transaction
DROP FUNCTION IF EXISTS log_meal_transaction(DATE, TEXT, JSONB);

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
    item JSONB;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Generate payload hash
    v_payload_hash := md5(p_date::TEXT || p_meal_name || p_items::TEXT);

    -- Check for idempotency
    SELECT id, payload_hash INTO v_meal_id, v_existing_hash
    FROM public.meals
    WHERE user_id = v_user_id AND operation_id = p_operation_id;

    IF FOUND THEN
        IF v_existing_hash != v_payload_hash THEN
            RAISE EXCEPTION 'IDEMPOTENCY_KEY_REUSED_MISMATCH';
        END IF;
        RETURN jsonb_build_object('created', false, 'already_exists', true, 'id', v_meal_id);
    END IF;

    -- Insert Meal
    INSERT INTO public.meals (user_id, date, name, operation_id, payload_hash)
    VALUES (v_user_id, p_date, p_meal_name, p_operation_id, v_payload_hash)
    RETURNING id INTO v_meal_id;

    -- Insert Items
    IF p_items IS NOT NULL AND jsonb_typeof(p_items) = 'array' THEN
        FOR item IN SELECT * FROM jsonb_array_elements(p_items)
        LOOP
            INSERT INTO public.meal_items (
                meal_id, user_id, food_name, calories, protein_g, carbs_g, fat_g, fiber_g, quantity_description
            ) VALUES (
                v_meal_id, v_user_id, 
                item->>'food_name', 
                (item->>'calories')::NUMERIC,
                (item->>'protein_g')::NUMERIC,
                (item->>'carbs_g')::NUMERIC,
                (item->>'fat_g')::NUMERIC,
                (item->>'fiber_g')::NUMERIC,
                item->>'quantity_description'
            );
        END LOOP;
    END IF;

    -- Recalculate daily summary internally
    PERFORM recalculate_daily_summary(p_date);

    RETURN jsonb_build_object('created', true, 'already_exists', false, 'id', v_meal_id);
END;
$$;

-- 4. Update log_workout_transaction
DROP FUNCTION IF EXISTS log_workout_transaction(DATE, TEXT, TEXT, INTEGER, TEXT, JSONB);

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
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Generate payload hash
    v_payload_hash := md5(p_date::TEXT || p_workout_type || p_name || COALESCE(p_duration_minutes::TEXT, '') || COALESCE(p_notes, '') || p_sets::TEXT);

    -- Check for idempotency
    SELECT id, payload_hash INTO v_workout_id, v_existing_hash
    FROM public.workouts
    WHERE user_id = v_user_id AND operation_id = p_operation_id;

    IF FOUND THEN
        IF v_existing_hash != v_payload_hash THEN
            RAISE EXCEPTION 'IDEMPOTENCY_KEY_REUSED_MISMATCH';
        END IF;
        RETURN jsonb_build_object('created', false, 'already_exists', true, 'id', v_workout_id);
    END IF;

    -- Insert Workout
    INSERT INTO public.workouts (user_id, date, workout_type, name, duration_minutes, notes, operation_id, payload_hash)
    VALUES (v_user_id, p_date, p_workout_type, p_name, p_duration_minutes, p_notes, p_operation_id, v_payload_hash)
    RETURNING id INTO v_workout_id;

    -- Insert Sets
    IF p_sets IS NOT NULL AND jsonb_typeof(p_sets) = 'array' THEN
        FOR set_item IN SELECT * FROM jsonb_array_elements(p_sets)
        LOOP
            INSERT INTO public.workout_sets (
                workout_id, user_id, exercise_id, set_number, reps, weight_kg, is_pr, notes, rest_seconds
            ) VALUES (
                v_workout_id, v_user_id, 
                (set_item->>'exercise_id')::UUID,
                (set_item->>'set_number')::INTEGER,
                (set_item->>'reps')::INTEGER,
                (set_item->>'weight_kg')::NUMERIC,
                COALESCE((set_item->>'is_pr')::BOOLEAN, FALSE),
                set_item->>'notes',
                (set_item->>'rest_seconds')::INTEGER
            );
        END LOOP;
    END IF;

    -- Recalculate daily summary internally
    PERFORM recalculate_daily_summary(p_date);

    RETURN jsonb_build_object('created', true, 'already_exists', false, 'id', v_workout_id);
END;
$$;
