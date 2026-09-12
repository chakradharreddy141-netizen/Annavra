'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { calculateNutritionTargets, CalculatedNutrition } from '@/lib/nutrition/calculator';
import { ActivityLevel, DietaryPreference, FitnessGoal, Gender } from '@/lib/types/database';
import { 
  User, 
  Target, 
  Activity, 
  Utensils, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Loader2,
  Flame,
  Dumbbell,
  Droplets
} from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [age, setAge] = useState<number>(24);
  const [gender, setGender] = useState<Gender>('male');
  const [heightCm, setHeightCm] = useState<number>(175);
  const [weightKg, setWeightKg] = useState<number>(72);
  const [bodyFatPct, setBodyFatPct] = useState<string>('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderately_active');

  const [fitnessGoal, setFitnessGoal] = useState<FitnessGoal>('gain_muscle');
  const [targetWeightKg, setTargetWeightKg] = useState<string>('76');

  const [mealsPerDay, setMealsPerDay] = useState<number>(4);
  const [workoutFrequency, setWorkoutFrequency] = useState<number>(5);
  const [currentSplit, setCurrentSplit] = useState<string>('Push / Pull / Legs');
  const [dailyStepTarget, setDailyStepTarget] = useState<number>(10000);

  const [dietaryPreference, setDietaryPreference] = useState<DietaryPreference>('non_vegetarian');
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string>('');

  // Target overrides state
  const [calculated, setCalculated] = useState<CalculatedNutrition | null>(null);
  const [overrideCalories, setOverrideCalories] = useState<number>(0);
  const [overrideProtein, setOverrideProtein] = useState<number>(0);
  const [overrideCarbs, setOverrideCarbs] = useState<number>(0);
  const [overrideFat, setOverrideFat] = useState<number>(0);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);
      setName(user.user_metadata?.full_name || user.email?.split('@')[0] || '');

      // Check if already completed onboarding
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();

      if (profile && profile.onboarding_completed) {
        router.push('/dashboard');
      }
      setFetchingUser(false);
    }
    checkAuth();
  }, [router, supabase]);

  // Recalculate targets whenever step 5 is entered or parameters change
  useEffect(() => {
    if (age && heightCm && weightKg) {
      const result = calculateNutritionTargets({
        age,
        gender,
        height_cm: heightCm,
        weight_kg: weightKg,
        activity_level: activityLevel,
        fitness_goal: fitnessGoal,
        target_weight_kg: targetWeightKg ? parseFloat(targetWeightKg) : null,
        meals_per_day: mealsPerDay,
      });
      setCalculated(result);
      setOverrideCalories(result.daily_calories);
      setOverrideProtein(result.daily_protein_g);
      setOverrideCarbs(result.daily_carbs_g);
      setOverrideFat(result.daily_fat_g);
    }
  }, [age, gender, heightCm, weightKg, activityLevel, fitnessGoal, targetWeightKg, mealsPerDay]);

  const handleFinishOnboarding = async () => {
    if (!userId || !calculated) return;
    setLoading(true);
    setError(null);

    try {
      const numTargetWeight = targetWeightKg ? parseFloat(targetWeightKg) : null;
      const numBodyFat = bodyFatPct ? parseFloat(bodyFatPct) : null;

      // 1. Update Profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          name,
          age,
          gender,
          height_cm: heightCm,
          activity_level: activityLevel,
          dietary_preference: dietaryPreference,
          dietary_restrictions: dietaryRestrictions || null,
          meals_per_day: mealsPerDay,
          workout_frequency: workoutFrequency,
          current_workout_split: currentSplit,
          daily_step_target: dailyStepTarget,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        });

      if (profileError) throw profileError;

      // 2. Insert Active Versioned Goal
      const { data: goalData, error: goalError } = await supabase
        .from('goals')
        .insert({
          user_id: userId,
          fitness_goal: fitnessGoal,
          target_weight_kg: numTargetWeight,
          current_weight_kg: weightKg,
          body_fat_pct: numBodyFat,
          bmr: calculated.bmr,
          tdee: calculated.tdee,
          daily_calories: overrideCalories || calculated.daily_calories,
          daily_protein_g: overrideProtein || calculated.daily_protein_g,
          daily_carbs_g: overrideCarbs || calculated.daily_carbs_g,
          daily_fat_g: overrideFat || calculated.daily_fat_g,
          daily_fiber_g: calculated.daily_fiber_g,
          daily_water_ml: calculated.daily_water_ml,
          bmi: calculated.bmi,
          bmi_category: calculated.bmi_category,
          is_active: true,
          effective_from: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (goalError) throw goalError;

      // 3. Insert Meal Targets
      if (goalData && calculated.meal_targets.length > 0) {
        const mealTargetsToInsert = calculated.meal_targets.map((mt) => ({
          goal_id: goalData.id,
          user_id: userId,
          meal_number: mt.meal_number,
          meal_name: mt.meal_name,
          target_calories: mt.target_calories,
          target_protein_g: mt.target_protein_g,
          target_carbs_g: mt.target_carbs_g,
          target_fat_g: mt.target_fat_g,
          is_active: true,
        }));

        await supabase.from('meal_targets').insert(mealTargetsToInsert);
      }

      // 4. Record Initial Weight Entry
      await supabase.from('weight_entries').insert({
        user_id: userId,
        date: new Date().toISOString().split('T')[0],
        weight_kg: weightKg,
        notes: 'Starting weight recorded during onboarding',
      });

      // 5. Initialize workout schedule based on workout frequency
      const defaultSchedule = [
        { day_of_week: 1, workout_type: 'Push (Chest/Shoulders/Triceps)', is_rest_day: false },
        { day_of_week: 2, workout_type: 'Pull (Back/Biceps)', is_rest_day: false },
        { day_of_week: 3, workout_type: 'Legs & Core', is_rest_day: false },
        { day_of_week: 4, workout_type: 'Active Recovery / Rest', is_rest_day: true },
        { day_of_week: 5, workout_type: 'Upper Body', is_rest_day: false },
        { day_of_week: 6, workout_type: 'Lower Body', is_rest_day: false },
        { day_of_week: 0, workout_type: 'Rest Day', is_rest_day: true },
      ];

      await supabase.from('workout_schedule').upsert(
        defaultSchedule.map((s) => ({
          user_id: userId,
          day_of_week: s.day_of_week,
          workout_type: s.workout_type,
          is_rest_day: s.is_rest_day,
        }))
      );

      router.push('/dashboard');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save onboarding information';
      setError(errorMsg);
      setLoading(false);
    }
  };

  if (fetchingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090a0f]">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  const steps = [
    { number: 1, label: 'Bio', icon: User },
    { number: 2, label: 'Goal', icon: Target },
    { number: 3, label: 'Lifestyle', icon: Activity },
    { number: 4, label: 'Diet', icon: Utensils },
    { number: 5, label: 'Targets', icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-[#090a0f] text-gray-100 flex flex-col justify-between p-4 sm:p-8 max-w-2xl mx-auto">
      {/* Header & Steps Progress */}
      <div>
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            First-Time Setup
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Personalize Annavra</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">We tailor daily calorie, macro, and workout metrics to your exact physiology.</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 px-2 sm:px-6">
          {steps.map((s) => {
            const Icon = s.icon;
            const isActive = s.number === currentStep;
            const isCompleted = s.number < currentStep;
            return (
              <div key={s.number} className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-semibold text-xs transition-all ${
                    isActive
                      ? 'bg-emerald-500 text-gray-950 ring-4 ring-emerald-500/20'
                      : isCompleted
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-[#181b26] text-gray-500 border border-[#232738]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[10px] mt-1.5 font-medium ${isActive ? 'text-emerald-400' : 'text-gray-500'}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {error}
          </div>
        )}

        {/* Card Content */}
        <div className="bg-[#12141c] border border-[#232738] rounded-2xl p-6 sm:p-8 shadow-xl">
          <div key={currentStep} className="animate-fade-in-up">
            {/* STEP 1: Personal Bio */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-white mb-2">Tell us about yourself</h2>
              
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#181b26] border border-[#232738] text-white text-sm focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#181b26] border border-[#232738] text-white text-sm focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#181b26] border border-[#232738] text-white text-sm focus:border-emerald-500 outline-none"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#181b26] border border-[#232738] text-white text-sm focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Current Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#181b26] border border-[#232738] text-white text-sm focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Body Fat % (Optional)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={bodyFatPct}
                    onChange={(e) => setBodyFatPct(e.target.value)}
                    placeholder="e.g. 16"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#181b26] border border-[#232738] text-white text-sm focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Daily Activity Level</label>
                  <select
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#181b26] border border-[#232738] text-white text-sm focus:border-emerald-500 outline-none"
                  >
                    <option value="sedentary">Sedentary (Desk Job)</option>
                    <option value="lightly_active">Lightly Active (1-2 days/wk)</option>
                    <option value="moderately_active">Moderately Active (3-5 days/wk)</option>
                    <option value="very_active">Very Active (6-7 days/wk)</option>
                    <option value="extremely_active">Extremely Active (Athletic/Labor)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Goal */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white mb-2">What is your primary fitness goal?</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'lose_fat', label: 'Lose Fat', desc: 'Caloric deficit, retain muscle mass' },
                  { key: 'maintain', label: 'Maintain Weight', desc: 'Sustain current body composition' },
                  { key: 'gain_muscle', label: 'Build Muscle (Lean Bulk)', desc: 'Controlled surplus & high protein' },
                  { key: 'gain_weight', label: 'Gain Weight', desc: 'Calorie dense surplus for mass' },
                  { key: 'improve_fitness', label: 'General Fitness & Energy', desc: 'Balanced nutrition & stamina' },
                  { key: 'improve_strength', label: 'Strength & Performance', desc: 'Optimize for heavy compound lifts' },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.key}
                    onClick={() => setFitnessGoal(item.key as FitnessGoal)}
                    className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer ${
                      fitnessGoal === item.key
                        ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                        : 'bg-[#181b26] border-[#232738] text-gray-300 hover:border-gray-700'
                    }`}
                  >
                    <div className="font-semibold text-sm">{item.label}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-[#232738]">
                <label className="block text-xs font-medium text-gray-300 mb-1">Target Weight (kg) - Optional</label>
                <input
                  type="number"
                  step="0.1"
                  value={targetWeightKg}
                  onChange={(e) => setTargetWeightKg(e.target.value)}
                  placeholder="e.g. 76"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#181b26] border border-[#232738] text-white text-sm focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Lifestyle */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white mb-2">Your routine and habits</h2>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  How many meals do you eat per day? ({mealsPerDay} meals)
                </label>
                <div className="flex gap-2">
                  {[2, 3, 4, 5, 6].map((num) => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setMealsPerDay(num)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                        mealsPerDay === num
                          ? 'bg-emerald-500 text-gray-950 border-emerald-500'
                          : 'bg-[#181b26] border-[#232738] text-gray-300 hover:border-gray-700'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Workout frequency ({workoutFrequency} days per week)
                </label>
                <input
                  type="range"
                  min="0"
                  max="7"
                  value={workoutFrequency}
                  onChange={(e) => setWorkoutFrequency(parseInt(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <div className="flex justify-between text-[11px] text-gray-500">
                  <span>0 (Rest only)</span>
                  <span>3-4 (Moderate)</span>
                  <span>7 (Daily)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Workout Split</label>
                <select
                  value={currentSplit}
                  onChange={(e) => setCurrentSplit(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#181b26] border border-[#232738] text-white text-sm focus:border-emerald-500 outline-none"
                >
                  <option value="Push / Pull / Legs">Push / Pull / Legs (PPL)</option>
                  <option value="Upper / Lower">Upper / Lower</option>
                  <option value="Full Body">Full Body (3x/week)</option>
                  <option value="Bro Split (Body Part)">Bro Split (Chest, Back, Arms, Legs, Shoulders)</option>
                  <option value="Calisthenics & Cardio">Calisthenics & Cardio</option>
                  <option value="Custom Routine">Custom Routine</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Daily Step Target</label>
                <input
                  type="number"
                  step="500"
                  value={dailyStepTarget}
                  onChange={(e) => setDailyStepTarget(parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#181b26] border border-[#232738] text-white text-sm focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* STEP 4: Dietary Preferences */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white mb-2">Dietary preferences & restrictions</h2>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'vegetarian', label: 'Vegetarian' },
                  { key: 'eggetarian', label: 'Eggetarian' },
                  { key: 'non_vegetarian', label: 'Non-Vegetarian' },
                  { key: 'vegan', label: 'Vegan' },
                  { key: 'custom', label: 'Custom' },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.key}
                    onClick={() => setDietaryPreference(item.key as DietaryPreference)}
                    className={`p-3 rounded-xl text-center border font-semibold text-sm transition-all ${
                      dietaryPreference === item.key
                        ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                        : 'bg-[#181b26] border-[#232738] text-gray-300 hover:border-gray-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Allergies or Dietary Restrictions (Optional)
                </label>
                <textarea
                  value={dietaryRestrictions}
                  onChange={(e) => setDietaryRestrictions(e.target.value)}
                  placeholder="e.g. Lactose intolerant, peanut allergy, gluten sensitive..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#181b26] border border-[#232738] text-white text-sm focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* STEP 5: Calculated Nutrition & Customization */}
          {currentStep === 5 && calculated && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white">Your Personalized Targets</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Calculated using the Mifflin-St Jeor equation. These are scientific estimates and can be modified at any time.
                </p>
              </div>

              {/* Stat Badges */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-[#181b26] border border-[#232738] text-center">
                  <div className="text-[10px] text-gray-500 uppercase font-semibold">BMR</div>
                  <div className="text-base font-bold text-white mt-0.5">{calculated.bmr} <span className="text-xs text-gray-400 font-normal">kcal</span></div>
                </div>
                <div className="p-3 rounded-xl bg-[#181b26] border border-[#232738] text-center">
                  <div className="text-[10px] text-gray-500 uppercase font-semibold">TDEE</div>
                  <div className="text-base font-bold text-white mt-0.5">{calculated.tdee} <span className="text-xs text-gray-400 font-normal">kcal</span></div>
                </div>
                <div className="p-3 rounded-xl bg-[#181b26] border border-[#232738] text-center">
                  <div className="text-[10px] text-gray-500 uppercase font-semibold">BMI ({calculated.bmi_category})</div>
                  <div className="text-base font-bold text-white mt-0.5">{calculated.bmi}</div>
                </div>
              </div>

              {/* Daily Macro Targets with Overrides */}
              <div className="p-4 rounded-xl bg-[#181b26] border border-[#232738] space-y-4">
                <div className="flex items-center justify-between border-b border-[#232738] pb-3">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-emerald-400" />
                    <div>
                      <span className="text-xs font-semibold text-gray-300">Daily Calorie Target</span>
                      <div className="text-[11px] text-gray-500">Based on {fitnessGoal.replace('_', ' ')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={overrideCalories}
                      onChange={(e) => setOverrideCalories(parseInt(e.target.value) || 0)}
                      className="w-20 px-2 py-1 rounded-lg bg-[#12141c] border border-[#232738] text-right font-bold text-emerald-400 text-sm focus:border-emerald-500 outline-none"
                    />
                    <span className="text-xs text-gray-400">kcal</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-blue-400 mb-1">Protein</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={overrideProtein}
                        onChange={(e) => setOverrideProtein(parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 rounded-lg bg-[#12141c] border border-[#232738] text-center font-bold text-white text-xs outline-none focus:border-blue-500"
                      />
                      <span className="text-[10px] text-gray-400">g</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-amber-400 mb-1">Carbs</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={overrideCarbs}
                        onChange={(e) => setOverrideCarbs(parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 rounded-lg bg-[#12141c] border border-[#232738] text-center font-bold text-white text-xs outline-none focus:border-amber-500"
                      />
                      <span className="text-[10px] text-gray-400">g</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-rose-400 mb-1">Fat</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={overrideFat}
                        onChange={(e) => setOverrideFat(parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 rounded-lg bg-[#12141c] border border-[#232738] text-center font-bold text-white text-xs outline-none focus:border-rose-500"
                      />
                      <span className="text-[10px] text-gray-400">g</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between text-xs text-gray-400 pt-2 border-t border-[#232738]/50">
                  <div className="flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Water: <strong className="text-white">{(calculated.daily_water_ml / 1000).toFixed(1)} L/day</strong></span>
                  </div>
                  <div>
                    <span>Fiber: <strong className="text-white">{calculated.daily_fiber_g}g/day</strong></span>
                  </div>
                </div>
              </div>

              {/* Suggested Per-Meal Split */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Suggested Meal Split ({mealsPerDay} meals)
                </h3>
                <div className="space-y-2">
                  {calculated.meal_targets.map((m) => (
                    <div
                      key={m.meal_number}
                      className="p-3 rounded-xl bg-[#181b26] border border-[#232738] flex items-center justify-between text-xs"
                    >
                      <div className="font-semibold text-white">{m.meal_name}</div>
                      <div className="flex items-center gap-3 text-gray-400">
                        <span className="text-emerald-400 font-medium">{m.target_calories} kcal</span>
                        <span>{m.target_protein_g}g P</span>
                        <span>{m.target_carbs_g}g C</span>
                        <span>{m.target_fat_g}g F</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mt-6 pt-4 border-t border-[#232738]">
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={() => setCurrentStep(currentStep - 1)}
            disabled={loading}
            className="py-2.5 px-4 rounded-xl bg-[#181b26] hover:bg-[#202433] border border-[#232738] text-white text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        ) : <div />}

        {currentStep < 5 ? (
          <button
            type="button"
            onClick={() => setCurrentStep(currentStep + 1)}
            className="py-2.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-gray-950 font-semibold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            Continue <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinishOnboarding}
            disabled={loading}
            className="py-2.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-gray-950 font-semibold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving your profile...
              </>
            ) : (
              <>
                Complete & Go to Dashboard <CheckCircle2 className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
