"use server"

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

import { getUserLocalDate } from "@/lib/date";

export async function saveWorkout(workoutData: {
  operation_id: string;
  workout_type: string;
  name: string;
  duration_minutes: number;
  notes?: string;
  sets: {
    exercise_id: string;
    set_number: number;
    reps: number;
    weight_kg: number;
    rest_seconds?: number;
    notes?: string;
  }[];
}) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Not authenticated" };
    }

    // 1. Fetch user timezone
    const { data: profile } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('id', user.id)
      .single();
      
    const tz = profile?.timezone || 'UTC';
    const localDate = getUserLocalDate(tz);

    // 2. Prepare Sets for JSONB
    const setsJson = [];
    
    for (const set of workoutData.sets) {
      let isPR = false;

      // Check for PR
      const { data: pastBest } = await supabase
        .from('workout_sets')
        .select('weight_kg, reps')
        .eq('user_id', user.id)
        .eq('exercise_id', set.exercise_id)
        .or(`weight_kg.gt.${set.weight_kg},and(weight_kg.eq.${set.weight_kg},reps.gte.${set.reps})`)
        .limit(1);

      if (!pastBest || pastBest.length === 0) {
        isPR = true;
      }

      setsJson.push({
        exercise_id: set.exercise_id,
        set_number: set.set_number,
        reps: set.reps,
        weight_kg: set.weight_kg,
        rest_seconds: set.rest_seconds || null,
        notes: set.notes || null,
        is_pr: isPR
      });
    }

    // 3. Call RPC Transaction
    const { data: rpcResult, error: rpcError } = await supabase.rpc('log_workout_transaction', {
      p_operation_id: workoutData.operation_id,
      p_date: localDate,
      p_workout_type: workoutData.workout_type,
      p_name: workoutData.name,
      p_duration_minutes: workoutData.duration_minutes,
      p_notes: workoutData.notes || null,
      p_sets: setsJson
    });

    if (rpcError) {
      console.error("Error from log_workout_transaction:", rpcError);
      return { error: rpcError.message || "Failed to log workout transaction" };
    }

    const workoutId = (rpcResult as any)?.id;
    const isDuplicate = (rpcResult as any)?.already_exists;

    revalidatePath('/workout');
    revalidatePath('/dashboard');
    return { success: true, workoutId, isDuplicate };
  } catch (error: any) {
    console.error("Action error:", error);
    return { error: error.message || "An unexpected error occurred" };
  }
}

export async function deleteWorkout(workoutId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Not authenticated" };
    }

    // 1. Get the date of the workout to recalculate later
    const { data: workoutToDelete } = await supabase
      .from('workouts')
      .select('date')
      .eq('id', workoutId)
      .eq('user_id', user.id)
      .single();

    if (!workoutToDelete) {
      return { error: "Workout not found" };
    }

    // Delete sets first (to avoid foreign key constraint issues if ON DELETE CASCADE is missing)
    await supabase.from('workout_sets').delete().eq('workout_id', workoutId).eq('user_id', user.id);
    
    // Delete workout
    const { error } = await supabase.from('workouts').delete().eq('id', workoutId).eq('user_id', user.id);
    
    if (error) {
      console.error("Error deleting workout:", error);
      return { error: "Failed to delete workout" };
    }
    
    // Recalculate daily summary
    await supabase.rpc('recalculate_daily_summary', {
      p_date: workoutToDelete.date
    });

    revalidatePath('/workout');
    revalidatePath('/progress');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error("Delete error:", error);
    return { error: error.message || "An unexpected error occurred" };
  }
}

export async function createCustomExercise(name: string, primaryMuscles: string[], secondaryMuscles: string[]) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Not authenticated" };
    }

    const { data: newExercise, error } = await supabase
      .from('exercises')
      .insert({
        user_id: user.id,
        name: name,
        muscle_group: 'Custom',
        primary_muscles: primaryMuscles,
        secondary_muscles: secondaryMuscles
      })
      .select()
      .single();
      
    if (error) {
      console.error("Error creating custom exercise:", error);
      return { error: "Failed to create exercise" };
    }
    
    return { success: true, exercise: newExercise };
  } catch (error: any) {
    console.error("Create exercise error:", error);
    return { error: error.message || "An unexpected error occurred" };
  }
}
