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
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(5);

  // 3. Did we already workout today?
  const alreadyWorkedOutToday = recentWorkouts?.some(w => w.date === today);

  return (
    <div className="max-w-xl mx-auto py-8 px-4 pb-24 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Workout Hub</h1>
      </div>

      {/* Today's Plan */}
      <div className="bg-[#12141c] border border-[#232738] rounded-2xl overflow-hidden shadow-xl">
        <div className={`p-6 ${isRestDay ? 'bg-blue-500/10' : 'bg-emerald-500/10'} border-b border-[#232738] relative overflow-hidden`}>
          <div className="absolute -right-4 -top-4 opacity-10">
            {isRestDay ? <Calendar className="w-32 h-32" /> : <Dumbbell className="w-32 h-32" />}
          </div>
          
          <span className={`text-xs font-bold uppercase tracking-wider ${isRestDay ? 'text-blue-400' : 'text-emerald-400'}`}>
            Today's Plan
          </span>
          <h2 className="text-3xl font-black text-white mt-1 relative z-10">
            {isRestDay ? 'Rest Day' : todayWorkoutName}
          </h2>
          
          {alreadyWorkedOutToday && (
            <div className="flex items-center gap-1.5 mt-3 text-sm font-semibold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              Workout completed today
            </div>
          )}
        </div>

        <div className="p-6 bg-[#181b26]">
          {isRestDay ? (
            <p className="text-sm text-gray-400 mb-6">
              Take it easy today. Active recovery like stretching or a light walk is recommended.
            </p>
          ) : (
            <p className="text-sm text-gray-400 mb-6">
              Ready to crush your {todayWorkoutName.toLowerCase()} session? High-velocity logging is ready.
            </p>
          )}

          <Link
            href="/workout/active"
            className="w-full py-4 flex items-center justify-center gap-2 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95"
          >
            <Play className="w-5 h-5 fill-current" />
            {alreadyWorkedOutToday ? 'Log Another Workout' : 'Start Workout'}
          </Link>
        </div>
      </div>

      {/* Recent History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-bold text-white">Recent Workouts</h2>
        </div>

        {!recentWorkouts || recentWorkouts.length === 0 ? (
          <div className="py-10 text-center border border-dashed border-[#232738] rounded-2xl bg-[#12141c]/50">
            <div className="w-12 h-12 rounded-full bg-[#181b26] flex items-center justify-center mx-auto mb-3">
              <Clock className="w-5 h-5 text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-300">No recent workouts</p>
            <p className="text-xs text-gray-500 mt-1">Your logged sessions will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentWorkouts.map((workout) => (
              <div key={workout.id} className="p-4 rounded-xl bg-[#181b26] border border-[#232738] flex items-center justify-between group">
                <div>
                  <div className="font-semibold text-sm text-white">{workout.name || workout.workout_type}</div>
                  <div className="text-xs text-gray-400 mt-1 flex items-center gap-3">
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
                <div className="p-2 text-gray-500 group-hover:text-emerald-400 transition-colors">
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
