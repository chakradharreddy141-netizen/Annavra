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

    -- Determine Meal Number
    SELECT COALESCE(MAX(meal_number), 0) + 1 INTO v_meal_number
    FROM public.meals
    WHERE user_id = v_user_id AND date = p_date;

    -- Calculate Totals authoritatively on the server
    IF p_items IS NOT NULL AND jsonb_typeof(p_items) = 'array' THEN
        FOR item IN SELECT * FROM jsonb_array_elements(p_items)
        LOOP
            v_item_qty := COALESCE((item->>'quantity')::NUMERIC, 1);
            v_item_cal := COALESCE((item->>'calories')::NUMERIC, 0);
            v_item_pro := COALESCE((item->>'protein_g')::NUMERIC, 0);
            v_item_car := COALESCE((item->>'carbs_g')::NUMERIC, 0);
            v_item_fat := COALESCE((item->>'fat_g')::NUMERIC, 0);
            v_item_fib := COALESCE((item->>'fiber_g')::NUMERIC, 0);

            -- Validate constraints before computing totals
            IF v_item_qty <= 0 OR v_item_cal < 0 OR v_item_pro < 0 OR v_item_car < 0 OR v_item_fat < 0 OR v_item_fib < 0 THEN
                RAISE EXCEPTION 'Nutrition values must be non-negative, quantity must be > 0';
            END IF;

            v_total_cal := v_total_cal + (v_item_cal * v_item_qty);
            v_total_pro := v_total_pro + (v_item_pro * v_item_qty);
            v_total_car := v_total_car + (v_item_car * v_item_qty);
            v_total_fat := v_total_fat + (v_item_fat * v_item_qty);
            v_total_fib := v_total_fib + (v_item_fib * v_item_qty);
        END LOOP;
    END IF;

    -- Insert Meal Authoritatively
    INSERT INTO public.meals (
        user_id, date, meal_number, meal_name,
        total_calories, total_protein_g, total_carbs_g, total_fat_g, total_fiber_g,
        operation_id, payload_hash
    ) VALUES (
        v_user_id, p_date, v_meal_number, p_meal_name,
        v_total_cal, v_total_pro, v_total_car, v_total_fat, v_total_fib,
        p_operation_id, v_payload_hash
    ) RETURNING id INTO v_meal_id;

    -- Create Meal Items
    IF p_items IS NOT NULL AND jsonb_typeof(p_items) = 'array' THEN
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
                COALESCE((item->>'calories')::NUMERIC, 0),
                COALESCE((item->>'protein_g')::NUMERIC, 0),
                COALESCE((item->>'carbs_g')::NUMERIC, 0),
                COALESCE((item->>'fat_g')::NUMERIC, 0),
                COALESCE((item->>'fiber_g')::NUMERIC, 0),
                COALESCE(item->>'nutrition_source', 'user_entered')
            );
        END LOOP;
    END IF;

    -- Synchronously update daily summary
    PERFORM recalculate_daily_summary(p_date);

    RETURN jsonb_build_object('created', true, 'already_exists', false, 'id', v_meal_id);
END;
$$;
