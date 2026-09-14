import React from 'react';
import Link from 'next/link';
import { getUserLocalDate } from '@/lib/date';
import { createClient } from '@/lib/supabase/server';
import { BentoCard } from '@/components/ui/BentoCard';
import { MagneticButton } from '@/components/ui/MagneticButton';
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

  // Data Fetching
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  const { data: activeGoal } = await supabase.from('goals').select('*').eq('user_id', user.id).eq('is_active', true).order('created_at', { ascending: false }).limit(1).single();
  const { data: mealTargets } = await supabase.from('meal_targets').select('*').eq('user_id', user.id).eq('is_active', true).order('meal_number', { ascending: true });
  
  const tz = profile?.timezone || 'UTC';
  const today = getUserLocalDate(tz);
  const { data: todayMeals } = await supabase.from('meals').select('*').eq('user_id', user.id).eq('date', today).order('meal_number', { ascending: true });
  const { data: todaySteps } = await supabase.from('step_entries').select('steps').eq('user_id', user.id).eq('date', today).single();
  const { data: latestWeight } = await supabase.from('weight_entries').select('weight_kg, date').eq('user_id', user.id).order('date', { ascending: false }).limit(1).single();
  
  const localDateObj = new Date(new Date().toLocaleString("en-US", { timeZone: tz }));
  const dayOfWeek = localDateObj.getDay();
  const { data: scheduledDay } = await supabase.from('workout_schedule').select('*').eq('user_id', user.id).eq('day_of_week', dayOfWeek).single();

  // Calculations
  const consumedCalories = (todayMeals || []).reduce((sum, m) => sum + (Number(m.total_calories) || 0), 0);
  const consumedProtein = (todayMeals || []).reduce((sum, m) => sum + (Number(m.total_protein_g) || 0), 0);
  const consumedCarbs = (todayMeals || []).reduce((sum, m) => sum + (Number(m.total_carbs_g) || 0), 0);
  const consumedFat = (todayMeals || []).reduce((sum, m) => sum + (Number(m.total_fat_g) || 0), 0);

  const targetCalories = activeGoal?.daily_calories || 2400;
  const targetProtein = activeGoal?.daily_protein_g || 140;
  const targetCarbs = activeGoal?.daily_carbs_g || 280;
  const targetFat = activeGoal?.daily_fat_g || 65;
  const targetSteps = profile?.daily_step_target || 10000;

  const currentWeight = latestWeight?.weight_kg || activeGoal?.current_weight_kg || 70;
  const stepsCount = todaySteps?.steps || 0;
  const totalMealsPlanned = profile?.meals_per_day || 3;
  const mealsLoggedCount = (todayMeals || []).length;

  return (
    <div className="space-y-8 pb-12">
      {/* Header Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#6b7280] uppercase tracking-widest mb-2">
            <Calendar className="w-3.5 h-3.5" />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1a1a1a] tracking-tight font-space">
            Command Center
          </h1>
          <p className="text-sm text-[#6b7280] mt-1">
            Focus: <strong className="text-[#1a1a1a] capitalize">{activeGoal?.fitness_goal?.replace('_', ' ') || 'Maintain'}</strong>
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3">
          <Link href="/scan">
            <MagneticButton variant="primary" className="text-sm h-12">
              <Scan className="w-4 h-4" /> Scan Food
            </MagneticButton>
          </Link>
          <Link href="/workout">
            <MagneticButton variant="outline" className="text-sm h-12">
              <Dumbbell className="w-4 h-4" /> Workout
            </MagneticButton>
          </Link>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="bento-grid">
        
        {/* Main Calorie Card (Large) */}
        <div className="bento-col-8">
          <BentoCard delay={0.1} className="h-full justify-between">
            <div className="flex justify-between items-start mb-6">
              <span className="text-xs text-[#6b7280] font-semibold uppercase tracking-widest">Energy Balance</span>
              <span className="text-xs bg-[#ff4500]/10 text-[#ff4500] font-bold px-3 py-1 rounded-full">
                {Math.round((consumedCalories / targetCalories) * 100)}% Consumed
              </span>
            </div>
            
            <div className="flex items-baseline gap-2 mb-8 font-space">
              <span className="text-6xl sm:text-7xl font-black text-[#1a1a1a] tracking-tighter">
                {Math.round(targetCalories - consumedCalories)}
              </span>
              <span className="text-lg font-medium text-[#6b7280]">kcal left</span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-[#6b7280]">Consumed: <strong className="text-[#1a1a1a]">{Math.round(consumedCalories)} kcal</strong></span>
                <span className="text-[#6b7280]">Target: <strong className="text-[#1a1a1a]">{Math.round(targetCalories)} kcal</strong></span>
              </div>
              <div className="h-2 w-full bg-[#f4f4f4] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#1a1a1a] rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min(100, (consumedCalories / targetCalories) * 100)}%` }}
                />
              </div>
            </div>
          </BentoCard>
        </div>

        {/* Secondary Info Column */}
        <div className="bento-col-4 flex flex-col gap-6">
          <BentoCard delay={0.2} className="flex-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#6b7280] uppercase tracking-widest mb-3">
              <Dumbbell className="w-4 h-4 text-[#1a1a1a]" />
              <span>Today&apos;s Training</span>
            </div>
            <div className="font-bold text-xl line-clamp-2 leading-tight text-[#1a1a1a] font-space tracking-tight">
              {scheduledDay?.is_rest_day ? 'Rest Day' : scheduledDay?.workout_type || 'Push Day'}
            </div>
            <p className="text-sm text-[#6b7280] mt-1">
              {scheduledDay?.is_rest_day ? 'Focus on active recovery' : 'Hit your scheduled routine'}
            </p>
          </BentoCard>

          <BentoCard delay={0.3} className="flex-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#6b7280] uppercase tracking-widest mb-3">
              <Footprints className="w-4 h-4 text-[#ff4500]" />
              <span>Activity</span>
            </div>
            <div className="font-bold text-2xl text-[#1a1a1a] font-space tracking-tight">
              {stepsCount.toLocaleString()} <span className="text-sm text-[#6b7280] font-medium">/ {targetSteps.toLocaleString()}</span>
            </div>
          </BentoCard>
        </div>

        {/* Macro Row */}
        <div className="bento-col-4">
          <BentoCard delay={0.4}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-[#1a1a1a] uppercase tracking-widest">Protein</span>
              <span className="text-xs font-bold text-[#1a1a1a] font-space bg-[#f4f4f4] px-2 py-1 rounded-md">
                {Math.round(consumedProtein)}/{Math.round(targetProtein)}g
              </span>
            </div>
            <div className="h-1.5 w-full bg-[#f4f4f4] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#ff4500] rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(100, (consumedProtein / targetProtein) * 100)}%` }}
              />
            </div>
          </BentoCard>
        </div>

        <div className="bento-col-4">
          <BentoCard delay={0.5}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-[#1a1a1a] uppercase tracking-widest">Carbs</span>
              <span className="text-xs font-bold text-[#1a1a1a] font-space bg-[#f4f4f4] px-2 py-1 rounded-md">
                {Math.round(consumedCarbs)}/{Math.round(targetCarbs)}g
              </span>
            </div>
            <div className="h-1.5 w-full bg-[#f4f4f4] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#1a1a1a] rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(100, (consumedCarbs / targetCarbs) * 100)}%` }}
              />
            </div>
          </BentoCard>
        </div>

        <div className="bento-col-4">
          <BentoCard delay={0.6}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-[#1a1a1a] uppercase tracking-widest">Fats</span>
              <span className="text-xs font-bold text-[#1a1a1a] font-space bg-[#f4f4f4] px-2 py-1 rounded-md">
                {Math.round(consumedFat)}/{Math.round(targetFat)}g
              </span>
            </div>
            <div className="h-1.5 w-full bg-[#f4f4f4] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#6b7280] rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(100, (consumedFat / targetFat) * 100)}%` }}
              />
            </div>
          </BentoCard>
        </div>

        {/* Meal Timeline */}
        <div className="bento-col-12">
          <BentoCard delay={0.7} hoverEffect={false}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-extrabold text-[#1a1a1a] font-space tracking-tight">Today&apos;s Ledger</h2>
                <p className="text-sm text-[#6b7280] mt-1">Track your meals chronologically</p>
              </div>
              <Link href="/scan">
                <MagneticButton variant="outline" className="h-10 text-xs px-4">
                  <Plus className="w-3.5 h-3.5" /> Log Meal
                </MagneticButton>
              </Link>
            </div>

            {(!todayMeals || todayMeals.length === 0) ? (
              <div className="py-12 text-center rounded-2xl bg-[#fcfcfc] border border-dashed border-[#e5e7eb]">
                <div className="w-12 h-12 rounded-full bg-[#f4f4f4] text-[#1a1a1a] flex items-center justify-center mx-auto mb-4">
                  <Scan className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#1a1a1a]">No entries yet</h3>
                <p className="text-sm text-[#6b7280] max-w-sm mx-auto mt-2 mb-6">
                  Log your first meal using the scanner to see your timeline update instantly.
                </p>
                <Link href="/scan">
                  <MagneticButton variant="primary" className="h-10 text-xs mx-auto">
                    Start Scanning <ArrowUpRight className="w-3 h-3" />
                  </MagneticButton>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {todayMeals.map((meal) => (
                  <div key={meal.id} className="p-5 rounded-2xl bg-[#fafafa] border border-[#f0f0f0] flex items-center justify-between group transition-colors hover:bg-white hover:border-[#e5e7eb] hover:shadow-sm">
                    <div>
                      <div className="font-bold text-base text-[#1a1a1a] font-space">{meal.meal_name}</div>
                      <div className="text-xs font-medium text-[#6b7280] mt-1 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(meal.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-lg text-[#ff4500] font-space">{meal.total_calories} kcal</div>
                      <div className="text-xs font-semibold text-[#6b7280] mt-1">
                        {meal.total_protein_g}P &bull; {meal.total_carbs_g}C &bull; {meal.total_fat_g}F
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </BentoCard>
        </div>

      </div>
    </div>
  );
}
