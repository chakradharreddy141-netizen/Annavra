-- ==============================================================================
-- Migration: 001_foundation.sql
-- Description: Complete schema for Annavra fitness platform
-- Covers: Profiles, Versioned Goals, Meal Targets, Weight, Meals, Foods,
--         Workouts, Exercises, Sets, Steps, Daily Summaries, Schedules, Saved Meals
-- Includes: Row Level Security (RLS) policies and automatic profile creation trigger
-- ==============================================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    name TEXT,
    age INTEGER,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    height_cm NUMERIC(6, 2),
    activity_level TEXT CHECK (activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active')),
    dietary_preference TEXT CHECK (dietary_preference IN ('vegetarian', 'vegan', 'eggetarian', 'non_vegetarian', 'custom')),
    dietary_restrictions TEXT,
    meals_per_day INTEGER DEFAULT 3 CHECK (meals_per_day BETWEEN 2 AND 6),
    workout_frequency INTEGER DEFAULT 4 CHECK (workout_frequency BETWEEN 0 AND 7),
    preferred_workout_days TEXT[] DEFAULT '{}',
    current_workout_split TEXT,
    daily_step_target INTEGER DEFAULT 10000,
    units TEXT DEFAULT 'metric' CHECK (units IN ('metric', 'imperial')),
    theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. GOALS TABLE (Versioned)
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    fitness_goal TEXT NOT NULL CHECK (fitness_goal IN ('lose_fat', 'maintain', 'gain_muscle', 'gain_weight', 'improve_fitness', 'improve_strength', 'custom')),
    target_weight_kg NUMERIC(6, 2),
    current_weight_kg NUMERIC(6, 2) NOT NULL,
    body_fat_pct NUMERIC(4, 1),
    bmr NUMERIC(7, 1) NOT NULL,
    tdee NUMERIC(7, 1) NOT NULL,
    daily_calories NUMERIC(7, 1) NOT NULL,
    daily_protein_g NUMERIC(6, 1) NOT NULL,
    daily_carbs_g NUMERIC(6, 1) NOT NULL,
    daily_fat_g NUMERIC(6, 1) NOT NULL,
    daily_fiber_g NUMERIC(6, 1) NOT NULL,
    daily_water_ml NUMERIC(7, 1) NOT NULL,
    bmi NUMERIC(4, 1) NOT NULL,
    bmi_category TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_until DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MEAL TARGETS TABLE
CREATE TABLE IF NOT EXISTS public.meal_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    meal_number INTEGER NOT NULL,
    meal_name TEXT NOT NULL,
    target_calories NUMERIC(7, 1) NOT NULL,
    target_protein_g NUMERIC(6, 1) NOT NULL,
    target_carbs_g NUMERIC(6, 1) NOT NULL,
    target_fat_g NUMERIC(6, 1) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. WEIGHT ENTRIES TABLE
CREATE TABLE IF NOT EXISTS public.weight_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    weight_kg NUMERIC(6, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. MEALS TABLE
CREATE TABLE IF NOT EXISTS public.meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    meal_number INTEGER NOT NULL,
    meal_name TEXT NOT NULL,
    total_calories NUMERIC(7, 1) DEFAULT 0,
    total_protein_g NUMERIC(6, 1) DEFAULT 0,
    total_carbs_g NUMERIC(6, 1) DEFAULT 0,
    total_fat_g NUMERIC(6, 1) DEFAULT 0,
    total_fiber_g NUMERIC(6, 1) DEFAULT 0,
    total_sugar_g NUMERIC(6, 1) DEFAULT 0,
    total_sodium_mg NUMERIC(7, 1) DEFAULT 0,
    image_url TEXT,
    logged_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. MEAL ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.meal_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    food_name TEXT NOT NULL,
    quantity NUMERIC(6, 2) NOT NULL DEFAULT 1,
    unit TEXT NOT NULL DEFAULT 'serving',
    serving_size TEXT,
    calories NUMERIC(7, 1) NOT NULL DEFAULT 0,
    protein_g NUMERIC(6, 1) NOT NULL DEFAULT 0,
    carbs_g NUMERIC(6, 1) NOT NULL DEFAULT 0,
    fat_g NUMERIC(6, 1) NOT NULL DEFAULT 0,
    fiber_g NUMERIC(6, 1) DEFAULT 0,
    sugar_g NUMERIC(6, 1) DEFAULT 0,
    sodium_mg NUMERIC(7, 1) DEFAULT 0,
    source TEXT DEFAULT 'manual',
    confidence NUMERIC(4, 2),
    fdc_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. WORKOUTS TABLE
CREATE TABLE IF NOT EXISTS public.workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    workout_type TEXT NOT NULL,
    name TEXT,
    duration_minutes INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. EXERCISES TABLE
CREATE TABLE IF NOT EXISTS public.exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    muscle_group TEXT NOT NULL,
    equipment TEXT,
    exercise_type TEXT DEFAULT 'compound',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. WORKOUT SETS TABLE
CREATE TABLE IF NOT EXISTS public.workout_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    set_number INTEGER NOT NULL,
    reps INTEGER NOT NULL,
    weight_kg NUMERIC(6, 2) NOT NULL,
    rest_seconds INTEGER,
    notes TEXT,
    is_pr BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. STEP ENTRIES TABLE
CREATE TABLE IF NOT EXISTS public.step_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    steps INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- 11. DAILY SUMMARIES TABLE
CREATE TABLE IF NOT EXISTS public.daily_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_calories NUMERIC(7, 1) DEFAULT 0,
    total_protein_g NUMERIC(6, 1) DEFAULT 0,
    total_carbs_g NUMERIC(6, 1) DEFAULT 0,
    total_fat_g NUMERIC(6, 1) DEFAULT 0,
    total_fiber_g NUMERIC(6, 1) DEFAULT 0,
    meals_logged INTEGER DEFAULT 0,
    water_ml NUMERIC(7, 1) DEFAULT 0,
    steps INTEGER DEFAULT 0,
    workout_completed BOOLEAN DEFAULT FALSE,
    goal_id UUID REFERENCES public.goals(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- 12. WORKOUT SCHEDULE TABLE
CREATE TABLE IF NOT EXISTS public.workout_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    workout_type TEXT,
    is_rest_day BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, day_of_week)
);

-- 13. SAVED MEALS TABLE
CREATE TABLE IF NOT EXISTS public.saved_meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_calories NUMERIC(7, 1) DEFAULT 0,
    total_protein_g NUMERIC(6, 1) DEFAULT 0,
    total_carbs_g NUMERIC(6, 1) DEFAULT 0,
    total_fat_g NUMERIC(6, 1) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_goals_user_active ON public.goals(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_meal_targets_user_goal ON public.meal_targets(user_id, goal_id);
CREATE INDEX IF NOT EXISTS idx_weight_entries_user_date ON public.weight_entries(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_meals_user_date ON public.meals(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_meal_items_meal ON public.meal_items(meal_id);
CREATE INDEX IF NOT EXISTS idx_workouts_user_date ON public.workouts(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_workout_sets_workout ON public.workout_sets(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise ON public.workout_sets(exercise_id, user_id);
CREATE INDEX IF NOT EXISTS idx_step_entries_user_date ON public.step_entries(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_date ON public.daily_summaries(user_id, date DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.step_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_meals ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Standard user ownership policies for all user-bound tables
CREATE POLICY "Users access own goals" ON public.goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users access own meal targets" ON public.meal_targets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users access own weight" ON public.weight_entries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users access own meals" ON public.meals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users access own meal items" ON public.meal_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users access own workouts" ON public.workouts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users access own workout sets" ON public.workout_sets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users access own steps" ON public.step_entries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users access own summaries" ON public.daily_summaries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users access own schedule" ON public.workout_schedule FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users access own saved meals" ON public.saved_meals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Exercises: users can view shared presets (user_id is null) or their own custom exercises
CREATE POLICY "Users can view preset and own exercises" ON public.exercises FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "Users can insert own exercises" ON public.exercises FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own exercises" ON public.exercises FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own exercises" ON public.exercises FOR DELETE USING (auth.uid() = user_id);

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- DEFAULT EXERCISES PRESETS (Global, user_id IS NULL)
-- ==============================================================================
INSERT INTO public.exercises (name, muscle_group, equipment, exercise_type, user_id)
VALUES
    ('Barbell Bench Press', 'Chest', 'Barbell', 'compound', NULL),
    ('Incline Dumbbell Press', 'Chest', 'Dumbbells', 'compound', NULL),
    ('Push-Up', 'Chest', 'Bodyweight', 'compound', NULL),
    ('Barbell Squat', 'Legs', 'Barbell', 'compound', NULL),
    ('Romanian Deadlift', 'Legs', 'Barbell', 'compound', NULL),
    ('Leg Press', 'Legs', 'Machine', 'compound', NULL),
    ('Barbell Deadlift', 'Back', 'Barbell', 'compound', NULL),
    ('Pull-Up', 'Back', 'Bodyweight', 'compound', NULL),
    ('Barbell Row', 'Back', 'Barbell', 'compound', NULL),
    ('Overhead Press', 'Shoulders', 'Barbell', 'compound', NULL),
    ('Lateral Raise', 'Shoulders', 'Dumbbells', 'isolation', NULL),
    ('Barbell Bicep Curl', 'Arms', 'Barbell', 'isolation', NULL),
    ('Tricep Rope Pushdown', 'Arms', 'Cable', 'isolation', NULL),
    ('Plank', 'Core', 'Bodyweight', 'isolation', NULL)
ON CONFLICT DO NOTHING;
