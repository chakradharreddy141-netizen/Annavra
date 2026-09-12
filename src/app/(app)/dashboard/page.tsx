import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { 
  Flame, 
  Dumbbell, 
  Footprints, 
  Scale, 
  Droplets, 
  Scan, 
  Plus, 
  Calendar,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Clock
} from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // 1. Fetch Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // 2. Fetch Active Goal
  const { data: activeGoal } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // 3. Fetch Meal Targets
  const { data: mealTargets } = await supabase
    .from('meal_targets')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('meal_number', { ascending: true });

  // 4. Fetch Today's Meals
  const today = new Date().toISOString().split('T')[0];
  const { data: todayMeals } = await supabase
    .from('meals')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .order('meal_number', { ascending: true });

  // 5. Fetch Today's Steps
  const { data: todaySteps } = await supabase
    .from('step_entries')
    .select('steps')
    .eq('user_id', user.id)
    .eq('date', today)
    .single();

  // 6. Fetch Latest Weight Entry
  const { data: latestWeight } = await supabase
    .from('weight_entries')
    .select('weight_kg, date')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  // 7. Today's Workout Schedule
  const dayOfWeek = new Date().getDay(); // 0 is Sunday
  const { data: scheduledDay } = await supabase
    .from('workout_schedule')
    .select('*')
    .eq('user_id', user.id)
    .eq('day_of_week', dayOfWeek)
    .single();

  // Aggregate consumed nutrition
  const consumedCalories = (todayMeals || []).reduce((sum, m) => sum + (Number(m.total_calories) || 0), 0);
  const consumedProtein = (todayMeals || []).reduce((sum, m) => sum + (Number(m.total_protein_g) || 0), 0);
  const consumedCarbs = (todayMeals || []).reduce((sum, m) => sum + (Number(m.total_carbs_g) || 0), 0);
  const consumedFat = (todayMeals || []).reduce((sum, m) => sum + (Number(m.total_fat_g) || 0), 0);

  const targetCalories = activeGoal?.daily_calories || 2400;
  const targetProtein = activeGoal?.daily_protein_g || 140;
  const targetCarbs = activeGoal?.daily_carbs_g || 280;
  const targetFat = activeGoal?.daily_fat_g || 65;
  const targetWater = activeGoal?.daily_water_ml || 2500;
  const targetSteps = profile?.daily_step_target || 10000;

  const remainingCalories = Math.max(0, targetCalories - consumedCalories);
  const remainingProtein = Math.max(0, targetProtein - consumedProtein);
  const remainingCarbs = Math.max(0, targetCarbs - consumedCarbs);
  const remainingFat = Math.max(0, targetFat - consumedFat);

  const currentWeight = latestWeight?.weight_kg || activeGoal?.current_weight_kg || 70;
  const targetWeight = activeGoal?.target_weight_kg || null;
  const stepsCount = todaySteps?.steps || 0;
  const totalMealsPlanned = profile?.meals_per_day || 3;
  const mealsLoggedCount = (todayMeals || []).length;

  return (
    <div className="space-y-6">
      {/* Header Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#00f0ff] uppercase tracking-wider mb-1 glow-cyan">
            <Calendar className="w-3.5 h-3.5" />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#f3f4f6] tracking-tight font-space">
            Command Center
          </h1>
          <p className="text-xs sm:text-sm text-[#9ca3af] mt-0.5">
            Goal: <strong className="text-[#f3f4f6] capitalize">{activeGoal?.fitness_goal?.replace('_', ' ') || 'Maintain'}</strong>
            {targetWeight && (
              <span> &bull; Target Weight: <strong className="text-[#00f0ff]">{targetWeight} kg</strong></span>
            )}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/scan"
            className="px-4 py-2.5 rounded-xl btn-cyber text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Scan className="w-4 h-4" /> Scan Food
          </Link>
          <Link
            href="/workout"
            className="px-4 py-2.5 rounded-xl cyber-panel cyber-panel-hover text-[#f3f4f6] font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Dumbbell className="w-4 h-4 text-[#a855f7] glow-purple" /> Start Workout
          </Link>
        </div>
      </div>

      {/* Main Nutrition Card */}
      <div className="cyber-panel rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-[#00f0ff]/10">
          <div>
            <span className="text-xs text-[#9ca3af] font-medium uppercase tracking-wider">Calories Remaining</span>
            <div className="flex items-baseline gap-2 mt-1 font-space">
              <span className="text-4xl sm:text-5xl font-black text-[#00f0ff] tracking-tight glow-cyan">
                {Math.round(remainingCalories)}
              </span>
              <span className="text-sm font-semibold text-[#9ca3af]">/ {Math.round(targetCalories)} kcal</span>
            </div>
            <p className="text-xs text-[#9ca3af] mt-1">
              Consumed <strong className="text-[#a855f7] font-semibold">{Math.round(consumedCalories)} kcal</strong> across {mealsLoggedCount}/{totalMealsPlanned} meals today
            </p>
          </div>

          {/* Calorie Bar */}
          <div className="w-full md:w-64 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[#9ca3af]">Daily Intake</span>
              <span className="text-[#00f0ff] font-bold">{Math.round((consumedCalories / targetCalories) * 100)}%</span>
            </div>
            <div className="h-3 w-full bg-[#0d1117] rounded-full overflow-hidden border border-[#00f0ff]/20">
              <div 
                className="h-full bg-gradient-to-r from-[#00f0ff] to-[#a855f7] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (consumedCalories / targetCalories) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Macros Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
          {/* Protein */}
          <div className="p-3.5 rounded-xl cyber-panel">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-[#00f0ff]">Protein</span>
              <span className="text-xs text-[#9ca3af] font-medium font-space">
                {Math.round(consumedProtein)} / {Math.round(targetProtein)}g
              </span>
            </div>
            <div className="h-2 w-full bg-[#0d1117] rounded-full overflow-hidden border border-[#00f0ff]/10">
              <div 
                className="h-full bg-[#00f0ff] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (consumedProtein / targetProtein) * 100)}%` }}
              />
            </div>
            <div className="text-[11px] text-[#9ca3af] mt-2 font-medium">
              {Math.round(remainingProtein)}g left to reach target
            </div>
          </div>

          {/* Carbs */}
          <div className="p-3.5 rounded-xl cyber-panel">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-[#a855f7]">Carbohydrates</span>
              <span className="text-xs text-[#9ca3af] font-medium font-space">
                {Math.round(consumedCarbs)} / {Math.round(targetCarbs)}g
              </span>
            </div>
            <div className="h-2 w-full bg-[#0d1117] rounded-full overflow-hidden border border-[#a855f7]/10">
              <div 
                className="h-full bg-[#a855f7] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (consumedCarbs / targetCarbs) * 100)}%` }}
              />
            </div>
            <div className="text-[11px] text-[#9ca3af] mt-2 font-medium">
              {Math.round(remainingCarbs)}g left to reach target
            </div>
          </div>

          {/* Fat */}
          <div className="p-3.5 rounded-xl cyber-panel">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-[#10b981]">Fats</span>
              <span className="text-xs text-[#9ca3af] font-medium font-space">
                {Math.round(consumedFat)} / {Math.round(targetFat)}g
              </span>
            </div>
            <div className="h-2 w-full bg-[#0d1117] rounded-full overflow-hidden border border-[#10b981]/10">
              <div 
                className="h-full bg-[#10b981] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (consumedFat / targetFat) * 100)}%` }}
              />
            </div>
            <div className="text-[11px] text-[#9ca3af] mt-2 font-medium">
              {Math.round(remainingFat)}g left to reach target
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Secondary Vitals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Workout Status */}
        <div className="p-4 rounded-2xl cyber-panel cyber-panel-hover">
          <div className="flex items-center gap-2 text-xs text-[#9ca3af] mb-2">
            <Dumbbell className="w-4 h-4 text-[#a855f7]" />
            <span>Today&apos;s Workout</span>
          </div>
          <div className="font-bold text-sm text-white font-space">
            {scheduledDay?.is_rest_day ? 'Rest Day' : scheduledDay?.workout_type || 'Push Day'}
          </div>
          <p className="text-[11px] text-[#9ca3af] mt-1">
            {scheduledDay?.is_rest_day ? 'Active recovery & rest' : 'Scheduled routine'}
          </p>
        </div>

        {/* Steps */}
        <div className="p-4 rounded-2xl cyber-panel cyber-panel-hover">
          <div className="flex items-center gap-2 text-xs text-[#9ca3af] mb-2">
            <Footprints className="w-4 h-4 text-[#00f0ff]" />
            <span>Daily Steps</span>
          </div>
          <div className="font-bold text-base text-white font-space">
            {stepsCount.toLocaleString()} <span className="text-xs text-[#9ca3af] font-normal">/ {targetSteps.toLocaleString()}</span>
          </div>
          <div className="text-[11px] text-[#9ca3af] mt-1">
            {Math.round((stepsCount / targetSteps) * 100)}% achieved
          </div>
        </div>

        {/* Current Weight */}
        <div className="p-4 rounded-2xl cyber-panel cyber-panel-hover">
          <div className="flex items-center gap-2 text-xs text-[#9ca3af] mb-2">
            <Scale className="w-4 h-4 text-[#10b981]" />
            <span>Current Weight</span>
          </div>
          <div className="font-bold text-base text-white font-space">
            {currentWeight} <span className="text-xs text-[#9ca3af] font-normal">kg</span>
          </div>
          <div className="text-[11px] text-[#9ca3af] mt-1">
            BMI: {activeGoal?.bmi || 23.5} ({activeGoal?.bmi_category || 'Normal'})
          </div>
        </div>
      </div>

      {/* Today's Meal Timeline / Empty State */}
      <div className="cyber-panel rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white font-space">Today&apos;s Meal Timeline</h2>
            <p className="text-xs text-[#9ca3af] mt-0.5">Track your meals chronologically to stay disciplined</p>
          </div>
          <Link
            href="/scan"
            className="px-3 py-1.5 rounded-xl cyber-panel cyber-panel-hover text-[#00f0ff] text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Log Meal
          </Link>
        </div>

        {(!todayMeals || todayMeals.length === 0) ? (
          <div className="py-8 text-center border border-dashed border-[#00f0ff]/20 rounded-xl">
            <div className="w-12 h-12 rounded-2xl bg-[#00f0ff]/10 border border-[#00f0ff]/20 text-[#00f0ff] glow-cyan flex items-center justify-center mx-auto mb-3">
              <Scan className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-white">No meals logged yet today</h3>
            <p className="text-xs text-[#9ca3af] max-w-sm mx-auto mt-1">
              Snap a photo of your meal with our AI Food Scanner to calculate calories and macros automatically.
            </p>
            <Link
              href="/scan"
              className="inline-flex items-center gap-1.5 px-4 py-2 mt-4 rounded-xl btn-cyber text-xs cursor-pointer"
            >
              Scan Your First Meal <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {todayMeals.map((meal) => (
              <div
                key={meal.id}
                className="p-4 rounded-xl cyber-panel cyber-panel-hover flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-sm text-white font-space">{meal.meal_name}</div>
                  <div className="text-xs text-[#9ca3af] mt-0.5 flex items-center gap-2">
                    <Clock className="w-3 h-3 text-[#9ca3af]" />
                    <span>{new Date(meal.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-[#00f0ff] font-space glow-cyan">{meal.total_calories} kcal</div>
                  <div className="text-[11px] text-[#9ca3af] mt-0.5">
                    {meal.total_protein_g}g P &bull; {meal.total_carbs_g}g C &bull; {meal.total_fat_g}g F
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Suggested Targets List for Unlogged Slots */}
        {mealTargets && mealTargets.length > 0 && (
          <div className="mt-6 pt-4 border-t border-[#00f0ff]/10">
            <span className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider block mb-2">
              Configured Meal Slots ({mealTargets.length} per day)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {mealTargets.map((slot) => (
                <div key={slot.id} className="p-2.5 rounded-xl bg-[#0d1117] border border-[#00f0ff]/10 text-xs">
                  <div className="font-medium text-[#f3f4f6] truncate">{slot.meal_name}</div>
                  <div className="text-[#00f0ff]/90 font-bold mt-0.5">{slot.target_calories} kcal</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
