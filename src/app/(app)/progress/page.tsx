import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { ArrowLeft, Target, TrendingUp, Scale, Flame, CalendarDays, Footprints } from 'lucide-react';
import Link from 'next/link';
import { WeightChart, ConsistencyHeatmap, StepChart } from './ProgressCharts';
import { getUserLocalDate } from '@/lib/date';
import { redirect } from 'next/navigation';
import { StepLogger } from './StepLogger';
import { WeightLogger, StepTargetEditor } from './ProgressInputs';

export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('daily_step_target, timezone')
    .eq('id', user.id)
    .single();

  const tz = profile?.timezone || 'UTC';

  // 1. Fetch Weight Entries (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const startDateStr = getUserLocalDate(tz, thirtyDaysAgo);

  const { data: weightEntries } = await supabase
    .from('weight_entries')
    .select('date, weight_kg')
    .eq('user_id', user.id)
    .gte('date', startDateStr)
    .order('date', { ascending: false });

  // 2. Fetch Active Goal
  const { data: activeGoal } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  // 3. Fetch Daily Summaries (for heatmap)
  const { data: summaries } = await supabase
    .from('daily_summaries')
    .select('date, total_calories, workout_completed, steps')
    .eq('user_id', user.id)
    .gte('date', startDateStr);

  const stepTarget = profile?.daily_step_target || 10000;

  // Prepare Chart Data
  const weightData = (weightEntries || []).map(w => ({
    date: w.date,
    weight: Number(w.weight_kg)
  }));

  const heatmapData = (summaries || []).map(s => ({
    date: s.date,
    calories: Number(s.total_calories),
    workedOut: s.workout_completed,
    target: Number(activeGoal?.daily_calories || 2400)
  }));

  const stepData = (summaries || []).map(s => ({
    date: s.date,
    steps: Number(s.steps || 0)
  }));

  const todayStr = getUserLocalDate(tz);
  const todayStepsStr = stepData.find(s => s.date === todayStr)?.steps || 0;

  const latestWeight = weightData.length > 0 ? weightData[0].weight : (activeGoal?.current_weight_kg || 0);
  const targetWeight = activeGoal?.target_weight_kg || 0;
  
  const weightChange = latestWeight - (weightData[weightData.length - 1]?.weight || latestWeight);

  return (
    <div className="max-w-xl mx-auto py-8 px-4 pb-24 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-[#1a1a1a] tracking-tight">Progress Analytics</h1>
      </div>

      {/* Goal Summary */}
      <div className="bg-[#ffffff] border border-[#1a1a1a]/10 rounded-2xl p-5 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#ff4500]/10 flex items-center justify-center">
            <Target className="w-6 h-6 text-[#ff4500]" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[#1a1a1a] capitalize">
              {activeGoal?.fitness_goal?.replace('_', ' ') || 'Maintain'}
            </div>
            <div className="text-xs text-[#6b7280] mt-0.5">Current Target</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-[#1a1a1a]">{targetWeight} <span className="text-sm text-[#6b7280] font-normal">kg</span></div>
          <div className="text-xs text-[#ff4500] font-medium">Goal Weight</div>
        </div>
      </div>

      {/* Weight Trends */}
      <div className="bg-[#ffffff] border border-[#1a1a1a]/10 rounded-2xl p-5 shadow-xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-[#1a1a1a] flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#ff4500]" />
              Weight Trend
            </h2>
            <p className="text-xs text-[#6b7280] mt-1">Past 30 days</p>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-[#1a1a1a]">{latestWeight} <span className="text-sm text-[#6b7280] font-normal">kg</span></div>
            {weightData.length > 1 && (
              <div className={`text-xs font-semibold flex items-center gap-1 justify-end mt-1 ${weightChange <= 0 ? 'text-[#ff4500]' : 'text-amber-400'}`}>
                <TrendingUp className={`w-3 h-3 ${weightChange <= 0 ? 'rotate-180' : ''}`} />
                {Math.abs(weightChange).toFixed(1)} kg {weightChange <= 0 ? 'down' : 'up'}
              </div>
            )}
          </div>
        </div>
        <div className="mb-6">
          <WeightLogger todayWeight={weightData.find(w => w.date === todayStr)?.weight || 0} />
        </div>
        <WeightChart data={weightData} />
      </div>

      {/* Step Tracker */}
      <div className="bg-[#ffffff] border border-[#1a1a1a]/10 rounded-2xl p-5 shadow-xl">
        <div className="mb-6">
          <h2 className="text-base font-bold text-[#1a1a1a] flex items-center gap-2">
            <Footprints className="w-4 h-4 text-blue-400" />
            Step Tracker
          </h2>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-[#6b7280]">
              Target: {stepTarget.toLocaleString()} steps.
            </p>
            <StepTargetEditor currentTarget={stepTarget} />
          </div>
        </div>
        
        <div className="mb-6">
          <StepLogger todaySteps={todayStepsStr} />
        </div>

        <StepChart data={stepData} target={stepTarget} />
      </div>

      {/* Consistency Heatmap */}
      <div className="bg-[#ffffff] border border-[#1a1a1a]/10 rounded-2xl p-5 shadow-xl">
        <div className="mb-6">
          <h2 className="text-base font-bold text-[#1a1a1a] flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-blue-400" />
            Discipline Heatmap
          </h2>
          <p className="text-xs text-[#6b7280] mt-1">
            Tracks days you hit your calorie target and completed a workout.
          </p>
        </div>
        
        <ConsistencyHeatmap data={heatmapData} />
        
        <div className="mt-4 pt-4 border-t border-[#1a1a1a]/10/50 grid grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] text-[#6b7280] font-semibold uppercase tracking-wider mb-1">Calories</div>
            <div className="text-sm font-medium text-[#1a1a1a]">Target: {activeGoal?.daily_calories || 2400} kcal</div>
          </div>
          <div>
            <div className="text-[10px] text-[#6b7280] font-semibold uppercase tracking-wider mb-1">Workouts</div>
            <div className="text-sm font-medium text-[#1a1a1a]">{summaries?.filter(s => s.workout_completed).length || 0} sessions</div>
          </div>
        </div>
      </div>
    </div>
  );
}
