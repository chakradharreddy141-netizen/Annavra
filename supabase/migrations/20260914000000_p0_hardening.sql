-- ==============================================================================
-- Migration: 20260914000000_p0_hardening.sql
-- Description: P0 Architecture, Security & Data Integrity Hardening
-- ==============================================================================

-- 1. EXPLICIT USER TIMEZONE
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- 2. NUTRITION PROVENANCE & FAKE CONFIDENCE REMOVAL
ALTER TABLE public.meal_items ADD COLUMN IF NOT EXISTS nutrition_source TEXT DEFAULT 'user_entered' CHECK (nutrition_source IN ('ai', 'nutrition_label', 'usda', 'user_entered'));
ALTER TABLE public.meal_items DROP COLUMN IF EXISTS confidence;
ALTER TABLE public.meal_items DROP COLUMN IF EXISTS source;

-- 3. CUSTOM EXERCISE SCHEMA FIXES
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS primary_muscles TEXT[];
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS secondary_muscles TEXT[];

-- 4. DATABASE INVARIANTS (CHECK CONSTRAINTS)
-- Apply to meal_items
ALTER TABLE public.meal_items ADD CONSTRAINT meal_items_positive_calories CHECK (calories >= 0);
ALTER TABLE public.meal_items ADD CONSTRAINT meal_items_positive_protein CHECK (protein_g >= 0);
ALTER TABLE public.meal_items ADD CONSTRAINT meal_items_positive_carbs CHECK (carbs_g >= 0);
ALTER TABLE public.meal_items ADD CONSTRAINT meal_items_positive_fat CHECK (fat_g >= 0);
ALTER TABLE public.meal_items ADD CONSTRAINT meal_items_positive_fiber CHECK (fiber_g >= 0);
ALTER TABLE public.meal_items ADD CONSTRAINT meal_items_positive_quantity CHECK (quantity > 0);
ALTER TABLE public.meal_items ADD CONSTRAINT meal_items_reasonable_quantity CHECK (quantity <= 10000);

-- Apply to meals
ALTER TABLE public.meals ADD CONSTRAINT meals_positive_calories CHECK (total_calories >= 0);
ALTER TABLE public.meals ADD CONSTRAINT meals_positive_protein CHECK (total_protein_g >= 0);
ALTER TABLE public.meals ADD CONSTRAINT meals_positive_carbs CHECK (total_carbs_g >= 0);
ALTER TABLE public.meals ADD CONSTRAINT meals_positive_fat CHECK (total_fat_g >= 0);
ALTER TABLE public.meals ADD CONSTRAINT meals_positive_fiber CHECK (total_fiber_g >= 0);

-- Apply to daily_summaries
ALTER TABLE public.daily_summaries ADD CONSTRAINT summaries_positive_calories CHECK (total_calories >= 0);
ALTER TABLE public.daily_summaries ADD CONSTRAINT summaries_positive_protein CHECK (total_protein_g >= 0);
ALTER TABLE public.daily_summaries ADD CONSTRAINT summaries_positive_carbs CHECK (total_carbs_g >= 0);
ALTER TABLE public.daily_summaries ADD CONSTRAINT summaries_positive_fat CHECK (total_fat_g >= 0);
ALTER TABLE public.daily_summaries ADD CONSTRAINT summaries_positive_fiber CHECK (total_fiber_g >= 0);

-- 5. RATE LIMITING TABLE
CREATE TABLE IF NOT EXISTS public.scan_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scan_time TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_scan_rate_limits ON public.scan_rate_limits(user_id, scan_time);
-- RLS for rate limits (internal only)
ALTER TABLE public.scan_rate_limits ENABLE ROW LEVEL SECURITY;

-- 6. RECALCULATION RPC (Reconstruct derived data)
CREATE OR REPLACE FUNCTION recalculate_daily_summary(p_user_id UUID, p_date DATE)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_cal NUMERIC(7,1) := 0;
    v_total_pro NUMERIC(6,1) := 0;
    v_total_car NUMERIC(6,1) := 0;
    v_total_fat NUMERIC(6,1) := 0;
    v_total_fib NUMERIC(6,1) := 0;
    v_meals_count INTEGER := 0;
    v_workout_completed BOOLEAN := FALSE;
    v_goal_id UUID;
BEGIN
    -- 1. Re-calculate totals from meals (which should match sum of items)
    SELECT 
        COALESCE(SUM(total_calories), 0),
        COALESCE(SUM(total_protein_g), 0),
        COALESCE(SUM(total_carbs_g), 0),
        COALESCE(SUM(total_fat_g), 0),
        COALESCE(SUM(total_fiber_g), 0),
        COUNT(id)
    INTO 
        v_total_cal, v_total_pro, v_total_car, v_total_fat, v_total_fib, v_meals_count
    FROM public.meals
    WHERE user_id = p_user_id AND date = p_date;

    -- 2. Check workout completion
    SELECT EXISTS (
        SELECT 1 FROM public.workouts 
        WHERE user_id = p_user_id AND date = p_date
    ) INTO v_workout_completed;

    -- 3. Get active goal
    SELECT id INTO v_goal_id 
    FROM public.goals 
    WHERE user_id = p_user_id AND is_active = TRUE 
    LIMIT 1;

    -- 4. Upsert daily summary
    INSERT INTO public.daily_summaries (
        user_id, date, total_calories, total_protein_g, total_carbs_g, total_fat_g, total_fiber_g, 
        meals_logged, workout_completed, goal_id, updated_at
    )
    VALUES (
        p_user_id, p_date, v_total_cal, v_total_pro, v_total_car, v_total_fat, v_total_fib, 
        v_meals_count, v_workout_completed, v_goal_id, NOW()
    )
    ON CONFLICT (user_id, date) DO UPDATE SET
        total_calories = EXCLUDED.total_calories,
        total_protein_g = EXCLUDED.total_protein_g,
        total_carbs_g = EXCLUDED.total_carbs_g,
        total_fat_g = EXCLUDED.total_fat_g,
        total_fiber_g = EXCLUDED.total_fiber_g,
        meals_logged = EXCLUDED.meals_logged,
        workout_completed = EXCLUDED.workout_completed,
        updated_at = NOW();
END;
$$;

-- 7. REAL POSTGRES TRANSACTION: MEALS
CREATE OR REPLACE FUNCTION log_meal_transaction(
    p_date DATE,
    p_meal_name TEXT,
    p_items JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
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
    v_item_qty NUMERIC;
    v_meal_number INTEGER;
BEGIN
    -- 1. Authenticate user strictly from Auth Context
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 2. Determine Meal Number
    SELECT COALESCE(MAX(meal_number), 0) + 1 INTO v_meal_number
    FROM public.meals
    WHERE user_id = v_user_id AND date = p_date;

    -- 3. Calculate Totals authoritatively on the server
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_item_qty := COALESCE((item->>'quantity')::NUMERIC, 1);
        v_item_cal := COALESCE((item->>'calories')::NUMERIC, 0);
        v_item_pro := COALESCE((item->>'protein_g')::NUMERIC, 0);
        v_item_car := COALESCE((item->>'carbs_g')::NUMERIC, 0);
        v_item_fat := COALESCE((item->>'fat_g')::NUMERIC, 0);
        v_item_fib := COALESCE((item->>'fiber_g')::NUMERIC, 0);

        -- Validate
        IF v_item_qty <= 0 OR v_item_cal < 0 OR v_item_pro < 0 OR v_item_car < 0 OR v_item_fat < 0 OR v_item_fib < 0 THEN
            RAISE EXCEPTION 'Invalid numerical values for item %', item->>'food_name';
        END IF;

        v_total_cal := v_total_cal + v_item_cal;
        v_total_pro := v_total_pro + v_item_pro;
        v_total_car := v_total_car + v_item_car;
        v_total_fat := v_total_fat + v_item_fat;
        v_total_fib := v_total_fib + v_item_fib;
    END LOOP;

    -- 4. Create Meal
    INSERT INTO public.meals (
        user_id, date, meal_number, meal_name,
        total_calories, total_protein_g, total_carbs_g, total_fat_g, total_fiber_g
    ) VALUES (
        v_user_id, p_date, v_meal_number, p_meal_name,
        v_total_cal, v_total_pro, v_total_car, v_total_fat, v_total_fib
    ) RETURNING id INTO v_meal_id;

    -- 5. Create Meal Items
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.meal_items (
            meal_id, user_id, food_name, quantity, unit,
            calories, protein_g, carbs_g, fat_g, fiber_g,
            nutrition_source
        ) VALUES (
            v_meal_id, v_user_id, 
            item->>'food_name', 
            COALESCE((item->>'quantity')::NUMERIC, 1),
            COALESCE(item->>'unit', 'serving'),
            (item->>'calories')::NUMERIC,
            (item->>'protein_g')::NUMERIC,
            (item->>'carbs_g')::NUMERIC,
            (item->>'fat_g')::NUMERIC,
            COALESCE((item->>'fiber_g')::NUMERIC, 0),
            COALESCE(item->>'nutrition_source', 'user_entered')
        );
    END LOOP;

    -- 6. Atomic Daily Summary update
    PERFORM recalculate_daily_summary(v_user_id, p_date);

    RETURN v_meal_id;
END;
$$;

-- 8. REAL POSTGRES TRANSACTION: WORKOUTS
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
                workout_id, user_id, exercise_id, set_number, reps, weight_kg
            ) VALUES (
                v_workout_id, v_user_id, 
                (set_item->>'exercise_id')::UUID,
                (set_item->>'set_number')::INTEGER,
                (set_item->>'reps')::INTEGER,
                (set_item->>'weight_kg')::NUMERIC
            );
        END LOOP;
    END IF;

    -- 3. Atomic daily summary update
    PERFORM recalculate_daily_summary(v_user_id, p_date);

    RETURN v_workout_id;
END;
$$;
