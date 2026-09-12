import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Dumbbell, Calendar, Clock, Trophy, ArrowRight, Play, CheckCircle2 } from 'lucide-react';

export default async function WorkoutHubPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const today = new Date().toISOString().split('T')[0];
  const dayOfWeek = new Date().getDay();

  // 1. Fetch Today's Schedule
  const { data: scheduledDay } = await supabase
    .from('workout_schedule')
    .select('*')
    .eq('user_id', user.id)
    .eq('day_of_week', dayOfWeek)
    .single();

  const isRestDay = scheduledDay?.is_rest_day;
  const todayWorkoutName = scheduledDay?.workout_type || 'Full Body';

  // 2. Fetch Recent Workouts (last 5)
  const { data: recentWorkouts } = await supabase
    .from('workouts')
    .select('*, workout_sets(is_pr)')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(5);

  // 3. Did we already workout today?
  const alreadyWorkedOutToday = recentWorkouts?.some(w => w.date === today);

  return (
    <div className="max-w-xl mx-auto py-8 px-4 pb-24 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-[#f3f4f6] tracking-tight font-space">Workout Hub</h1>
      </div>

      {/* Today's Plan */}
      <div className="cyber-panel rounded-2xl overflow-hidden">
        <div className={`p-6 ${isRestDay ? 'bg-[#00f0ff]/10' : 'bg-[#a855f7]/10'} border-b ${isRestDay ? 'border-[#00f0ff]/20' : 'border-[#a855f7]/20'} relative overflow-hidden`}>
          <div className="absolute -right-4 -top-4 opacity-10">
            {isRestDay ? <Calendar className="w-32 h-32" /> : <Dumbbell className="w-32 h-32" />}
          </div>
          
          <span className={`text-xs font-bold uppercase tracking-wider ${isRestDay ? 'text-[#00f0ff]' : 'text-[#a855f7]'}`}>
            Today's Plan
          </span>
          <h2 className="text-3xl font-black text-[#f3f4f6] mt-1 relative z-10 font-space">
            {isRestDay ? 'Rest Day' : todayWorkoutName}
          </h2>
          
          {alreadyWorkedOutToday && (
            <div className="flex items-center gap-1.5 mt-3 text-sm font-semibold text-[#00f0ff]">
              <CheckCircle2 className="w-4 h-4" />
              Workout completed today
            </div>
          )}
        </div>

        <div className="p-6 bg-[#07080b]/50">
          {isRestDay ? (
            <p className="text-sm text-[#9ca3af] mb-6">
              Take it easy today. Active recovery like stretching or a light walk is recommended.
            </p>
          ) : (
            <p className="text-sm text-[#9ca3af] mb-6">
              Ready to crush your {todayWorkoutName.toLowerCase()} session? High-velocity logging is ready.
            </p>
          )}

          <Link
            href="/workout/active"
            className="w-full py-4 flex items-center justify-center gap-2 btn-cyber rounded-xl font-bold transition-all active:scale-95 text-[#f3f4f6]"
          >
            <Play className="w-5 h-5 fill-current" />
            {alreadyWorkedOutToday ? 'Log Another Workout' : 'Start Workout'}
          </Link>
        </div>
      </div>

      {/* Recent History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-bold text-[#f3f4f6] font-space">Recent Workouts</h2>
        </div>

        {!recentWorkouts || recentWorkouts.length === 0 ? (
          <div className="py-10 text-center border border-dashed border-[#a855f7]/20 rounded-2xl cyber-panel">
            <div className="w-12 h-12 rounded-full bg-[#a855f7]/10 flex items-center justify-center mx-auto mb-3">
              <Clock className="w-5 h-5 text-[#a855f7] glow-purple" />
            </div>
            <p className="text-sm font-medium text-[#f3f4f6]">No recent workouts</p>
            <p className="text-xs text-[#9ca3af] mt-1">Your logged sessions will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentWorkouts.map((workout) => (
              <div key={workout.id} className="p-4 rounded-xl cyber-panel cyber-panel-hover flex items-center justify-between group">
                <div>
                  <div className="font-semibold text-sm text-[#f3f4f6] font-space flex items-center gap-2">
                    {workout.name || workout.workout_type}
                    {workout.workout_sets?.some((s: any) => s.is_pr) && (
                      <Trophy className="w-4 h-4 text-[#a855f7]" style={{ filter: 'drop-shadow(0 0 4px #a855f7)' }} />
                    )}
                  </div>
                  <div className="text-xs text-[#9ca3af] mt-1 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(workout.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    {workout.duration_minutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {workout.duration_minutes} min
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-2 text-[#9ca3af] group-hover:text-[#a855f7] transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
