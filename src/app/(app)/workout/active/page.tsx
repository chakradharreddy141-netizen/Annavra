import React from 'react';
import { createClient } from '@/lib/supabase/server';
import ActiveWorkoutClient from './ActiveWorkoutClient';

export default async function ActiveWorkoutPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Await searchParams in Next.js 15
  const params = await searchParams;

  // Fetch exercises (user's custom exercises + globally seeded exercises)
  const { data: exercises, error: exercisesErr } = await supabase
    .from('exercises')
    .select('*')
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .order('name');
  if (exercisesErr) console.error('Active Workout exercises error:', exercisesErr);

  const allExercises = exercises || [];
  
  // Deduplicate by name just in case a custom exercise overrides a global one
  const uniqueExercises = Array.from(new Map(allExercises.map(item => [item.name.toLowerCase(), item])).values());

  const { data: profile, error: profileErr } = await supabase.from('profiles').select('timezone').eq('id', user.id).single();
  if (profileErr && profileErr.code !== 'PGRST116') console.error('Active Workout profile error:', profileErr);
  const tz = profile?.timezone || 'UTC';
  
  const localDateObj = new Date(new Date().toLocaleString("en-US", { timeZone: tz }));
  const dayOfWeek = localDateObj.getDay();

  // Fetch Today's Schedule for default workout name
  const { data: scheduledDay, error: schedErr } = await supabase
    .from('workout_schedule')
    .select('*')
    .eq('user_id', user.id)
    .eq('day_of_week', dayOfWeek)
    .single();
  if (schedErr && schedErr.code !== 'PGRST116') console.error('Active Workout schedule error:', schedErr);

  const defaultName = params.type || (scheduledDay?.is_rest_day 
    ? 'Ad-hoc Workout' 
    : (scheduledDay?.workout_type || 'Workout'));

  return (
    <ActiveWorkoutClient 
      exercises={uniqueExercises.sort((a, b) => a.name.localeCompare(b.name))} 
      defaultWorkoutName={defaultName} 
    />
  );
}
