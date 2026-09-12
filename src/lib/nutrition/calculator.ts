import { ActivityLevel, FitnessGoal, Gender } from '../types/database';

export interface CalculationInput {
  age: number;
  gender: Gender;
  height_cm: number;
  weight_kg: number;
  activity_level: ActivityLevel;
  fitness_goal: FitnessGoal;
  target_weight_kg?: number | null;
  meals_per_day: number;
}

export interface CalculatedNutrition {
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
  meal_targets: Array<{
    meal_number: number;
    meal_name: string;
    target_calories: number;
    target_protein_g: number;
    target_carbs_g: number;
    target_fat_g: number;
  }>;
}

/**
 * Calculates BMR using the Mifflin-St Jeor Equation
 */
export function calculateBMR(age: number, gender: Gender, heightCm: number, weightKg: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === 'male') {
    return Math.round(base + 5);
  }
  if (gender === 'female') {
    return Math.round(base - 161);
  }
  return Math.round(base - 78);
}

/**
 * Multipliers for activity levels
 */
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extremely_active: 1.9,
};

/**
 * Calculates TDEE based on BMR and physical activity
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.2;
  return Math.round(bmr * multiplier);
}

/**
 * Calculates Body Mass Index and categorization
 */
export function calculateBMI(weightKg: number, heightCm: number): { bmi: number; category: string } {
  const heightM = heightCm / 100;
  const bmi = Number((weightKg / (heightM * heightM)).toFixed(1));
  let category = 'Normal weight';
  if (bmi < 18.5) {
    category = 'Underweight';
  } else if (bmi >= 25 && bmi < 30) {
    category = 'Overweight';
  } else if (bmi >= 30) {
    category = 'Obese';
  }
  return { bmi, category };
}

/**
 * Calculates complete nutrition profile including macros and per-meal targets
 */
export function calculateNutritionTargets(input: CalculationInput): CalculatedNutrition {
  const bmr = calculateBMR(input.age, input.gender, input.height_cm, input.weight_kg);
  const tdee = calculateTDEE(bmr, input.activity_level);

  let calorieAdjustment = 1.0;
  if (input.fitness_goal === 'lose_fat') {
    calorieAdjustment = 0.8; // 20% deficit
  } else if (input.fitness_goal === 'gain_muscle') {
    calorieAdjustment = 1.1; // 10% surplus
  } else if (input.fitness_goal === 'gain_weight') {
    calorieAdjustment = 1.15; // 15% surplus
  } else if (input.fitness_goal === 'improve_strength') {
    calorieAdjustment = 1.05; // 5% surplus
  }

  const daily_calories = Math.round(tdee * calorieAdjustment);

  // Protein calculation: 2.0g-2.2g per kg for muscle building/fat loss, 1.8g for others
  const proteinMultiplier = (input.fitness_goal === 'gain_muscle' || input.fitness_goal === 'lose_fat') ? 2.0 : 1.8;
  const daily_protein_g = Math.round(Math.max(60, input.weight_kg * proteinMultiplier));

  // Fat calculation: ~25% of total calories (9 kcal/g)
  const fatCalories = daily_calories * 0.25;
  const daily_fat_g = Math.round(fatCalories / 9);

  // Carbs calculation: remainder of calories (4 kcal/g)
  const proteinCalories = daily_protein_g * 4;
  const remainingCalories = daily_calories - proteinCalories - fatCalories;
  const daily_carbs_g = Math.round(Math.max(40, remainingCalories / 4));

  // Fiber calculation: ~14g per 1000 kcal
  const daily_fiber_g = Math.round(Math.max(25, (daily_calories / 1000) * 14));

  // Water calculation: 35ml per kg of body weight
  const daily_water_ml = Math.round(input.weight_kg * 35);

  const { bmi, category: bmi_category } = calculateBMI(input.weight_kg, input.height_cm);

  // Distribute across meals
  const mealCount = Math.max(2, Math.min(6, input.meals_per_day || 3));
  const meal_targets = generateMealTargets(mealCount, daily_calories, daily_protein_g, daily_carbs_g, daily_fat_g);

  return {
    bmr,
    tdee,
    daily_calories,
    daily_protein_g,
    daily_carbs_g,
    daily_fat_g,
    daily_fiber_g,
    daily_water_ml,
    bmi,
    bmi_category,
    meal_targets,
  };
}

function generateMealTargets(
  mealCount: number,
  totalCalories: number,
  totalProtein: number,
  totalCarbs: number,
  totalFat: number
) {
  const mealNamesMap: Record<number, string[]> = {
    2: ['Brunch / First Meal', 'Dinner'],
    3: ['Breakfast', 'Lunch', 'Dinner'],
    4: ['Breakfast', 'Lunch', 'Snack / Pre-workout', 'Dinner'],
    5: ['Breakfast', 'Morning Snack', 'Lunch', 'Evening Snack', 'Dinner'],
    6: ['Breakfast', 'Morning Snack', 'Lunch', 'Post-workout', 'Dinner', 'Night Snack'],
  };

  const names = mealNamesMap[mealCount] || Array.from({ length: mealCount }, (_, i) => `Meal ${i + 1}`);
  const fraction = 1 / mealCount;

  return names.map((name, index) => ({
    meal_number: index + 1,
    meal_name: name,
    target_calories: Math.round(totalCalories * fraction),
    target_protein_g: Math.round(totalProtein * fraction),
    target_carbs_g: Math.round(totalCarbs * fraction),
    target_fat_g: Math.round(totalFat * fraction),
  }));
}
