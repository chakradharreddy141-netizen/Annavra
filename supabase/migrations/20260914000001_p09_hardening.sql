-- P0.9 Hardening Migration
-- Address critical security, constraints, and correctness issues

-- 1. Atomic Rate Limiting for AI Scans
CREATE OR REPLACE FUNCTION check_and_increment_scan_rate_limit()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_scans_last_hour INTEGER;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Clean up old records (optional but keeps table small)
    DELETE FROM scan_rate_limits WHERE scan_time < NOW() - INTERVAL '1 hour';

    -- Count existing scans in the last hour
    SELECT COUNT(*) INTO v_scans_last_hour
    FROM scan_rate_limits
    WHERE user_id = v_user_id AND scan_time >= NOW() - INTERVAL '1 hour';

    IF v_scans_last_hour >= 20 THEN
        RETURN FALSE; -- Rate limited
    END IF;

    -- Insert new scan (atomic as it's within a transaction in Postgres)
    INSERT INTO scan_rate_limits (user_id) VALUES (v_user_id);
    
    RETURN TRUE;
END;
$$;

-- 2. Drop the insecure old summary function
DROP FUNCTION IF EXISTS recalculate_daily_summary(UUID, DATE);

-- 3. New secure summary function (uses auth.uid() directly and rebuilds from meal_items)
CREATE OR REPLACE FUNCTION recalculate_daily_summary(p_date DATE)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_total_cal NUMERIC(7,1) := 0;
    v_total_pro NUMERIC(6,1) := 0;
    v_total_car NUMERIC(6,1) := 0;
    v_total_fat NUMERIC(6,1) := 0;
    v_total_fib NUMERIC(6,1) := 0;
    v_meals_count INTEGER := 0;
    v_workout_completed BOOLEAN := FALSE;
    v_goal_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 1. Re-calculate totals from meal_items (Lowest level source of truth)
    SELECT 
        COALESCE(SUM(mi.calories), 0),
        COALESCE(SUM(mi.protein_g), 0),
        COALESCE(SUM(mi.carbs_g), 0),
        COALESCE(SUM(mi.fat_g), 0),
        COALESCE(SUM(mi.fiber_g), 0),
        COUNT(DISTINCT m.id)
    INTO 
        v_total_cal, v_total_pro, v_total_car, v_total_fat, v_total_fib, v_meals_count
    FROM public.meals m
    LEFT JOIN public.meal_items mi ON mi.meal_id = m.id
    WHERE m.user_id = v_user_id AND m.date = p_date;

    -- 2. Check workout completion
    SELECT EXISTS (
        SELECT 1 FROM public.workouts 
        WHERE user_id = v_user_id AND date = p_date
    ) INTO v_workout_completed;

    -- 3. Get active goal
    SELECT id INTO v_goal_id 
    FROM public.goals 
    WHERE user_id = v_user_id AND is_active = TRUE 
    LIMIT 1;

    -- 4. Upsert daily summary
    INSERT INTO public.daily_summaries (
        user_id, date, goal_id, total_calories, total_protein_g, 
        total_carbs_g, total_fat_g, total_fiber_g, 
        water_ml, steps, workout_completed
    )
    VALUES (
        v_user_id, p_date, v_goal_id, v_total_cal, v_total_pro, 
        v_total_car, v_total_fat, v_total_fib, 
        0, 0, v_workout_completed
    )
    ON CONFLICT (user_id, date) DO UPDATE SET
        goal_id = EXCLUDED.goal_id,
        total_calories = EXCLUDED.total_calories,
        total_protein_g = EXCLUDED.total_protein_g,
        total_carbs_g = EXCLUDED.total_carbs_g,
        total_fat_g = EXCLUDED.total_fat_g,
        total_fiber_g = EXCLUDED.total_fiber_g,
        workout_completed = EXCLUDED.workout_completed,
        updated_at = NOW();
END;
$$;


-- 4. Re-declare log_meal_transaction with SET search_path and calling the new summary RPC
CREATE OR REPLACE FUNCTION log_meal_transaction(
    p_date DATE,
    p_meal_name TEXT,
    p_items JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_meal_id UUID;
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
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 1. Calculate totals dynamically securely on server
    IF p_items IS NOT NULL THEN
        FOR item IN SELECT * FROM jsonb_array_elements(p_items)
        LOOP
            v_total_cal := v_total_cal + COALESCE((item->>'calories')::NUMERIC, 0);
            v_total_pro := v_total_pro + COALESCE((item->>'protein_g')::NUMERIC, 0);
            v_total_car := v_total_car + COALESCE((item->>'carbs_g')::NUMERIC, 0);
            v_total_fat := v_total_fat + COALESCE((item->>'fat_g')::NUMERIC, 0);
            v_total_fib := v_total_fib + COALESCE((item->>'fiber_g')::NUMERIC, 0);
        END LOOP;
    END IF;

    -- 2. Create the meal record
    INSERT INTO public.meals (
        user_id, date, name, total_calories, total_protein_g, total_carbs_g, total_fat_g, total_fiber_g
    ) VALUES (
        v_user_id, p_date, p_meal_name, v_total_cal, v_total_pro, v_total_car, v_total_fat, v_total_fib
    ) RETURNING id INTO v_meal_id;

    -- 3. Create the meal items
    IF p_items IS NOT NULL THEN
        FOR item IN SELECT * FROM jsonb_array_elements(p_items)
        LOOP
            INSERT INTO public.meal_items (
                meal_id, user_id, food_name, quantity, calories, protein_g, carbs_g, fat_g, fiber_g, nutrition_source
            ) VALUES (
                v_meal_id,
                v_user_id,
                item->>'food_name',
                COALESCE((item->>'quantity')::NUMERIC, 1),
                COALESCE((item->>'calories')::NUMERIC, 0),
                COALESCE((item->>'protein_g')::NUMERIC, 0),
                COALESCE((item->>'carbs_g')::NUMERIC, 0),
                COALESCE((item->>'fat_g')::NUMERIC, 0),
                COALESCE((item->>'fiber_g')::NUMERIC, 0),
                COALESCE(item->>'nutrition_source', 'user_entered')
            );
        END LOOP;
    END IF;

    -- 4. Atomic Daily Summary update
    PERFORM recalculate_daily_summary(p_date);

    RETURN v_meal_id;
END;
$$;


-- 5. Re-declare log_workout_transaction to capture is_pr, notes, and rest_seconds + SET search_path
CREATE OR REPLACE FUNCTION log_workout_transaction(
    p_date DATE,
    p_workout_type TEXT,
    p_name TEXT,
    p_duration_minutes INTEGER,
    p_notes TEXT,
    p_sets JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_workout_id UUID;
    set_item JSONB;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 1. Create workout
    INSERT INTO public.workouts (
        user_id, date, workout_type, name, duration_minutes, notes
    ) VALUES (
        v_user_id, p_date, p_workout_type, p_name, p_duration_minutes, p_notes
    ) RETURNING id INTO v_workout_id;

    -- 2. Create sets
    IF p_sets IS NOT NULL THEN
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

    -- 3. Atomic daily summary update
    PERFORM recalculate_daily_summary(p_date);

    RETURN v_workout_id;
END;
$$;

-- 6. Add Upper-Bound Semantic Validation to meals/meal_items
-- No meal item should have absurd macros (> 5000 kcal, > 500g protein etc for a single item).
ALTER TABLE public.meal_items 
    ADD CONSTRAINT meal_items_calories_check CHECK (calories <= 5000),
    ADD CONSTRAINT meal_items_protein_check CHECK (protein_g <= 500),
    ADD CONSTRAINT meal_items_carbs_check CHECK (carbs_g <= 1000),
    ADD CONSTRAINT meal_items_fat_check CHECK (fat_g <= 500),
    ADD CONSTRAINT meal_items_fiber_check CHECK (fiber_g <= 100);

ALTER TABLE public.meals
    ADD CONSTRAINT meals_calories_check CHECK (total_calories <= 20000),
    ADD CONSTRAINT meals_protein_check CHECK (total_protein_g <= 1000),
    ADD CONSTRAINT meals_carbs_check CHECK (total_carbs_g <= 2000),
    ADD CONSTRAINT meals_fat_check CHECK (total_fat_g <= 1000),
    ADD CONSTRAINT meals_fiber_check CHECK (total_fiber_g <= 200);

