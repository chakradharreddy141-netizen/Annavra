import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, UtensilsCrossed } from 'lucide-react';
import MealCard from './MealCard';
import { QuickLogModal } from './QuickLogModal';

export default async function NutritionPage(props: {
  searchParams: Promise<{ date?: string }>
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Determine target date
  const today = new Date().toISOString().split('T')[0];
  const currentDateStr = searchParams?.date || today;
  
  // Validate date format (YYYY-MM-DD)
  const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(currentDateStr);
  const targetDate = isValidDate ? currentDateStr : today;

  // Calculate prev/next dates for navigation
  const dateObj = new Date(targetDate);
  const prevDateObj = new Date(dateObj);
  prevDateObj.setDate(prevDateObj.getDate() - 1);
  const prevDateStr = prevDateObj.toISOString().split('T')[0];

  const nextDateObj = new Date(dateObj);
  nextDateObj.setDate(nextDateObj.getDate() + 1);
  const nextDateStr = nextDateObj.toISOString().split('T')[0];

  const isToday = targetDate === today;

  // Fetch Active Goal
  const { data: activeGoal } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  // Fetch meals for the date
  const { data: meals } = await supabase
    .from('meals')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', targetDate)
    .order('meal_number', { ascending: true });

  // Fetch items for all meals today
  const mealIds = (meals || []).map(m => m.id);
  let allMealItems: any[] = [];
  if (mealIds.length > 0) {
    const { data: items } = await supabase
      .from('meal_items')
      .select('*')
      .in('meal_id', mealIds);
    allMealItems = items || [];
  }

  // Calculate Aggregates
  const consumedCalories = (meals || []).reduce((sum, m) => sum + (Number(m.total_calories) || 0), 0);
  const consumedProtein = (meals || []).reduce((sum, m) => sum + (Number(m.total_protein_g) || 0), 0);
  const consumedCarbs = (meals || []).reduce((sum, m) => sum + (Number(m.total_carbs_g) || 0), 0);
  const consumedFat = (meals || []).reduce((sum, m) => sum + (Number(m.total_fat_g) || 0), 0);
  const consumedFiber = (meals || []).reduce((sum, m) => sum + (Number(m.total_fiber_g) || 0), 0);

  const targetCalories = activeGoal?.daily_calories || 2400;
  const targetProtein = activeGoal?.daily_protein_g || 140;
  const targetCarbs = activeGoal?.daily_carbs_g || 280;
  const targetFat = activeGoal?.daily_fat_g || 65;
  const targetFiber = activeGoal?.daily_fiber_g || 30;

  // Format date for display
  const displayDate = new Date(targetDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="max-w-xl mx-auto py-8 px-4 pb-24 space-y-6">
      {/* Header & Date Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold text-[#1a1a1a] tracking-tight font-space">Nutrition Log</h1>
        
        <div className="flex items-center self-start sm:self-auto cyber-panel rounded-xl p-1">
          <Link 
            href={`/nutrition?date=${prevDateStr}`}
            className="p-1.5 text-[#6b7280] hover:text-[#ff4500] hover:bg-[#ff4500]/10 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="px-3 flex items-center gap-2 text-sm font-semibold text-[#1a1a1a] min-w-[110px] justify-center">
            <CalendarIcon className="w-3.5 h-3.5 text-[#ff4500] glow-cyan" />
            {isToday ? 'Today' : displayDate}
          </div>
          <Link 
            href={`/nutrition?date=${nextDateStr}`}
            className={`p-1.5 rounded-lg transition-colors ${isToday ? 'text-[#6b7280] opacity-50 cursor-default' : 'text-[#6b7280] hover:text-[#ff4500] hover:bg-[#ff4500]/10'}`}
            style={{ pointerEvents: isToday ? 'none' : 'auto' }}
          >
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Main Macro Summary */}
      <div className="cyber-panel rounded-2xl p-5">
        <div className="flex justify-between items-end mb-6">
          <div>
            <span className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Calories</span>
            <div className="flex items-baseline gap-2 mt-1 font-space">
              <span className="text-4xl font-black text-white">{Math.round(consumedCalories)}</span>
              <span className="text-sm font-medium text-[#6b7280]">/ {Math.round(targetCalories)} kcal</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-[#ff4500] glow-cyan font-space">
              {Math.max(0, Math.round(targetCalories - consumedCalories))}
            </div>
            <span className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Remaining</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {/* Protein */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-[#ff4500]">Protein</span>
              <span className="text-[#6b7280] font-space">{Math.round(consumedProtein)}g</span>
            </div>
            <div className="h-1.5 w-full bg-[#f4f4f4] rounded-full overflow-hidden border border-[#1a1a1a]/10">
              <div 
                className="h-full bg-[#00f0ff] rounded-full"
                style={{ width: `${Math.min(100, (consumedProtein / targetProtein) * 100)}%` }}
              />
            </div>
            <div className="text-[10px] text-[#6b7280] text-right font-space">{Math.round(targetProtein)}g</div>
          </div>

          {/* Carbs */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-[#1a1a1a]">Carbs</span>
              <span className="text-[#6b7280] font-space">{Math.round(consumedCarbs)}g</span>
            </div>
            <div className="h-1.5 w-full bg-[#f4f4f4] rounded-full overflow-hidden border border-[#1a1a1a]/10">
              <div 
                className="h-full bg-[#a855f7] rounded-full"
                style={{ width: `${Math.min(100, (consumedCarbs / targetCarbs) * 100)}%` }}
              />
            </div>
            <div className="text-[10px] text-[#6b7280] text-right font-space">{Math.round(targetCarbs)}g</div>
          </div>

          {/* Fat */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-[#10b981]">Fat</span>
              <span className="text-[#6b7280] font-space">{Math.round(consumedFat)}g</span>
            </div>
            <div className="h-1.5 w-full bg-[#f4f4f4] rounded-full overflow-hidden border border-[#10b981]/20">
              <div 
                className="h-full bg-[#10b981] rounded-full"
                style={{ width: `${Math.min(100, (consumedFat / targetFat) * 100)}%` }}
              />
            </div>
            <div className="text-[10px] text-[#6b7280] text-right font-space">{Math.round(targetFat)}g</div>
          </div>
          
          {/* Fiber */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-[#ef4444]">Fiber</span>
              <span className="text-[#6b7280] font-space">{Math.round(consumedFiber)}g</span>
            </div>
            <div className="h-1.5 w-full bg-[#f4f4f4] rounded-full overflow-hidden border border-[#ef4444]/20">
              <div 
                className="h-full bg-[#ef4444] rounded-full"
                style={{ width: `${Math.min(100, (consumedFiber / targetFiber) * 100)}%` }}
              />
            </div>
            <div className="text-[10px] text-[#6b7280] text-right font-space">{Math.round(targetFiber)}g</div>
          </div>
        </div>
      </div>

      {/* Meals List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-bold text-[#1a1a1a] font-space">Logged Meals</h2>
          {isToday && (
            <div className="flex items-center gap-3">
              <QuickLogModal date={targetDate} goalId={activeGoal?.id} />
              <Link href="/scan" className="text-sm font-semibold text-[#ff4500] hover:text-[#ff4500]/80 transition-colors">
                + Log Food
              </Link>
            </div>
          )}
        </div>

        {!meals || meals.length === 0 ? (
          <div className="py-10 text-center border border-dashed border-[#1a1a1a]/10 rounded-2xl cyber-panel">
            <div className="w-12 h-12 rounded-full bg-[#ff4500]/10 flex items-center justify-center mx-auto mb-3">
              <UtensilsCrossed className="w-5 h-5 text-[#ff4500] glow-cyan" />
            </div>
            <p className="text-sm font-medium text-[#1a1a1a]">No meals logged on this date</p>
            {isToday && (
              <p className="text-xs text-[#6b7280] mt-1 max-w-[200px] mx-auto">
                Use the scanner or log manually to hit your targets
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {meals.map((meal) => {
              const items = allMealItems.filter(item => item.meal_id === meal.id);
              return <MealCard key={meal.id} meal={meal} items={items} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
