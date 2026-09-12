import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { WeightChart, ConsistencyHeatmap, StepChart } from './ProgressCharts';
import { StepLogger } from './StepLogger';
import { WeightLogger, StepTargetEditor } from './ProgressInputs';
import { TrendingUp, Scale, Target, Flame, CalendarDays, Footprints } from 'lucide-react';

export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // 1. Fetch Weight Entries (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const startDateStr = thirtyDaysAgo.toISOString().split('T')[0];

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

  // 4. Fetch Profile for step target
  const { data: profile } = await supabase
    .from('profiles')
    .select('daily_step_target')
    .eq('id', user.id)
    .single();

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

  const todayStr = new Date().toISOString().split('T')[0];
  const todayStepsStr = stepData.find(s => s.date === todayStr)?.steps || 0;

  const latestWeight = weightData.length > 0 ? weightData[0].weight : (activeGoal?.current_weight_kg || 0);
  const targetWeight = activeGoal?.target_weight_kg || 0;
  
  const weightChange = latestWeight - (weightData[weightData.length - 1]?.weight || latestWeight);

  return (
    <div className="max-w-xl mx-auto py-8 px-4 pb-24 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Progress Analytics</h1>
      </div>

      {/* Goal Summary */}
      <div className="bg-[#12141c] border border-[#232738] rounded-2xl p-5 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <Target className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white capitalize">
              {activeGoal?.fitness_goal?.replace('_', ' ') || 'Maintain'}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">Current Target</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-white">{targetWeight} <span className="text-sm text-gray-500 font-normal">kg</span></div>
          <div className="text-xs text-emerald-400 font-medium">Goal Weight</div>
        </div>
      </div>

      {/* Weight Trends */}
      <div className="bg-[#12141c] border border-[#232738] rounded-2xl p-5 shadow-xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-400" />
              Weight Trend
            </h2>
            <p className="text-xs text-gray-400 mt-1">Past 30 days</p>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-white">{latestWeight} <span className="text-sm text-gray-500 font-normal">kg</span></div>
            {weightData.length > 1 && (
              <div className={`text-xs font-semibold flex items-center gap-1 justify-end mt-1 ${weightChange <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
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
      <div className="bg-[#12141c] border border-[#232738] rounded-2xl p-5 shadow-xl">
        <div className="mb-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Footprints className="w-4 h-4 text-blue-400" />
            Step Tracker
          </h2>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-400">
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
      <div className="bg-[#12141c] border border-[#232738] rounded-2xl p-5 shadow-xl">
        <div className="mb-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-blue-400" />
            Discipline Heatmap
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Tracks days you hit your calorie target and completed a workout.
          </p>
        </div>
        
        <ConsistencyHeatmap data={heatmapData} />
        
        <div className="mt-4 pt-4 border-t border-[#232738]/50 grid grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">Calories</div>
            <div className="text-sm font-medium text-white">Target: {activeGoal?.daily_calories || 2400} kcal</div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">Workouts</div>
            <div className="text-sm font-medium text-white">{summaries?.filter(s => s.workout_completed).length || 0} sessions</div>
          </div>
        </div>
      </div>
    </div>
  );
}
