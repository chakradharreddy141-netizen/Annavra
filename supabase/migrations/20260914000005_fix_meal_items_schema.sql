-- Fix missing column that somehow got dropped or wasn't added
ALTER TABLE public.meal_items ADD COLUMN IF NOT EXISTS nutrition_source TEXT DEFAULT 'user_entered' CHECK (nutrition_source IN ('ai', 'nutrition_label', 'usda', 'user_entered'));
