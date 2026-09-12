export type Gender = 'male' | 'female' | 'other';
export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
export type DietaryPreference = 'vegetarian' | 'vegan' | 'eggetarian' | 'non_vegetarian' | 'custom';
export type FitnessGoal = 'lose_fat' | 'maintain' | 'gain_muscle' | 'gain_weight' | 'improve_fitness' | 'improve_strength' | 'custom';
export type Units = 'metric' | 'imperial';
export type Theme = 'light' | 'dark' | 'system';

export interface Profile {
  id: string;
  email: string | null;
  name: string | null;
  age: number | null;
  gender: Gender | null;
  height_cm: number | null;
  activity_level: ActivityLevel | null;
  dietary_preference: DietaryPreference | null;
  dietary_restrictions: string | null;
  meals_per_day: number;
  workout_frequency: number;
  preferred_workout_days: string[];
  current_workout_split: string | null;
  daily_step_target: number;
  units: Units;
  theme: Theme;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  fitness_goal: FitnessGoal;
  target_weight_kg: number | null;
  current_weight_kg: number;
  body_fat_pct: number | null;
  bmr: number;
  tdee: number;
  daily_calories: number;
  daily_protein_g: number;
  daily_carbs_g: number;
  daily_fat_g: number;
  daily_fiber_g: number;
  daily_water_ml: number;
  bmi: number;
  bmi_category: string;
  is_active: boolean;
  effective_from: string;
  effective_until: string | null;
  created_at: string;
}

export interface MealTarget {
  id: string;
  goal_id: string | null;
  user_id: string;
  meal_number: number;
  meal_name: string;
  target_calories: number;
  target_protein_g: number;
  target_carbs_g: number;
  target_fat_g: number;
  is_active: boolean;
  created_at: string;
}

export interface WeightEntry {
  id: string;
  user_id: string;
  date: string;
  weight_kg: number;
  notes: string | null;
  created_at: string;
}

export interface Meal {
  id: string;
  user_id: string;
  date: string;
  meal_number: number;
  meal_name: string;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  total_fiber_g: number;
  total_sugar_g: number;
  total_sodium_mg: number;
  image_url: string | null;
  logged_at: string;
  created_at: string;
  updated_at: string;
}

export interface MealItem {
  id: string;
  meal_id: string;
  user_id: string;
  food_name: string;
  quantity: number;
  unit: string;
  serving_size: string | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  source: string;
  confidence: number | null;
  fdc_id: string | null;
  created_at: string;
}

export interface Workout {
  id: string;
  user_id: string;
  date: string;
  workout_type: string;
  name: string | null;
  duration_minutes: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Exercise {
  id: string;
  user_id: string | null;
  name: string;
  muscle_group: string;
  equipment: string | null;
  exercise_type: string;
  created_at: string;
}

export interface WorkoutSet {
  id: string;
  workout_id: string;
  exercise_id: string;
  user_id: string;
  set_number: number;
  reps: number;
  weight_kg: number;
  rest_seconds: number | null;
  notes: string | null;
  is_pr: boolean;
  created_at: string;
}

export interface StepEntry {
  id: string;
  user_id: string;
  date: string;
  steps: number;
  created_at: string;
  updated_at: string;
}

export interface DailySummary {
  id: string;
  user_id: string;
  date: string;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  total_fiber_g: number;
  meals_logged: number;
  water_ml: number;
  steps: number;
  workout_completed: boolean;
  goal_id: string | null;
  created_at: string;
  updated_at: string;
}
