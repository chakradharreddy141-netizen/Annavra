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

  // Fetch exercises (preset + user's custom exercises)
  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .order('name');

  // Provide some default preset exercises if the DB doesn't have them yet
  const presetExercises = [
    { id: 'p1', name: 'Bench Press', muscle_group: 'Chest' },
    { id: 'p2', name: 'Squat', muscle_group: 'Legs' },
    { id: 'p3', name: 'Deadlift', muscle_group: 'Back' },
    { id: 'p4', name: 'Overhead Press', muscle_group: 'Shoulders' },
    { id: 'p5', name: 'Pull-up', muscle_group: 'Back' },
    { id: 'p6', name: 'Barbell Row', muscle_group: 'Back' },
    { id: 'p7', name: 'Dumbbell Curl', muscle_group: 'Arms' },
    { id: 'p8', name: 'Tricep Extension', muscle_group: 'Arms' },
    { id: 'p9', name: 'Leg Press', muscle_group: 'Legs' },
    { id: 'p10', name: 'Lateral Raise', muscle_group: 'Shoulders' },
    { id: 'p11', name: 'Incline Bench Press', muscle_group: 'Chest' },
    { id: 'p12', name: 'Lat Pulldown', muscle_group: 'Back' },
    { id: 'p13', name: 'Leg Curl', muscle_group: 'Legs' },
    { id: 'p14', name: 'Leg Extension', muscle_group: 'Legs' },
    { id: 'p15', name: 'Calf Raise', muscle_group: 'Legs' },
  ];

  const allExercises = [...presetExercises, ...(exercises || [])];
  
  // Deduplicate by name
  const uniqueExercises = Array.from(new Map(allExercises.map(item => [item.name.toLowerCase(), item])).values());

  const { data: profile } = await supabase.from('profiles').select('timezone').eq('id', user.id).single();
  const tz = profile?.timezone || 'UTC';
  
  const localDateObj = new Date(new Date().toLocaleString("en-US", { timeZone: tz }));
  const dayOfWeek = localDateObj.getDay();

  // Fetch Today's Schedule for default workout name
  const { data: scheduledDay } = await supabase
    .from('workout_schedule')
    .select('*')
    .eq('user_id', user.id)
    .eq('day_of_week', dayOfWeek)
    .single();

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
