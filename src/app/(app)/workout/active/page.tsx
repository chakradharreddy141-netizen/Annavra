import React from 'react';
import { createClient } from '@/lib/supabase/server';
import ActiveWorkoutClient from './ActiveWorkoutClient';

export default async function ActiveWorkoutPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch exercises (preset + user's custom exercises)
  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .order('name');

  const today = new Date().toISOString().split('T')[0];
  const dayOfWeek = new Date().getDay();

  // Fetch Today's Schedule for default workout name
  const { data: scheduledDay } = await supabase
    .from('workout_schedule')
    .select('*')
    .eq('user_id', user.id)
    .eq('day_of_week', dayOfWeek)
    .single();

  const defaultName = scheduledDay?.is_rest_day 
    ? 'Ad-hoc Workout' 
    : (scheduledDay?.workout_type || 'Workout');

  return (
    <ActiveWorkoutClient 
      exercises={exercises || []} 
      defaultWorkoutName={defaultName} 
    />
  );
}
