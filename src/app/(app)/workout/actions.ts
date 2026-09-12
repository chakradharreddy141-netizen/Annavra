"use server"

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveWorkout(workoutData: {
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

    const today = new Date().toISOString().split('T')[0];

    // 1. Insert Workout
    const { data: newWorkout, error: workoutError } = await supabase
      .from('workouts')
      .insert({
        user_id: user.id,
        date: today,
        workout_type: workoutData.workout_type,
        name: workoutData.name,
        duration_minutes: workoutData.duration_minutes,
        notes: workoutData.notes
      })
      .select()
      .single();

    if (workoutError || !newWorkout) {
      console.error("Error creating workout:", workoutError);
      return { error: "Failed to save workout" };
    }

    // 2. Process Sets and Detect PRs
    const setsToInsert = [];
    
    // Group sets by exercise_id to batch PR checks if needed, but simple iteration is fine for a small array
    for (const set of workoutData.sets) {
      let isPR = false;

      // Check for PR
      // A PR is defined as lifting a weight heavier than ever before, OR
      // lifting the same max weight for more reps than ever before.
      const { data: pastBest } = await supabase
        .from('workout_sets')
        .select('weight_kg, reps')
        .eq('user_id', user.id)
        .eq('exercise_id', set.exercise_id)
        .or(`weight_kg.gt.${set.weight_kg},and(weight_kg.eq.${set.weight_kg},reps.gte.${set.reps})`)
        .limit(1);

      // If pastBest is empty, this set beats or equals all past sets in terms of weight/reps combo
      // To strictly be a PR, it must beat them.
      if (!pastBest || pastBest.length === 0) {
        // Also ensure they have AT LEAST one past log to call it a PR, otherwise it's just their baseline?
        // Actually, let's call the first one a PR too to give them dopamine.
        isPR = true;
      }

      setsToInsert.push({
        workout_id: newWorkout.id,
        exercise_id: set.exercise_id,
        user_id: user.id,
        set_number: set.set_number,
        reps: set.reps,
        weight_kg: set.weight_kg,
        rest_seconds: set.rest_seconds || null,
        notes: set.notes || null,
        is_pr: isPR
      });
    }

    // 3. Insert Sets
    if (setsToInsert.length > 0) {
      const { error: setsError } = await supabase
        .from('workout_sets')
        .insert(setsToInsert);

      if (setsError) {
        console.error("Error inserting sets:", setsError);
        return { error: "Failed to save workout sets" };
      }
    }

    // 4. Update Daily Summary
    const { data: summary } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    if (summary) {
      await supabase.from('daily_summaries').update({
        workout_completed: true
      }).eq('id', summary.id);
    } else {
      const { data: goal } = await supabase.from('goals').select('id').eq('user_id', user.id).eq('is_active', true).single();
      
      await supabase.from('daily_summaries').insert({
        user_id: user.id,
        date: today,
        workout_completed: true,
        goal_id: goal?.id
      });
    }

    revalidatePath('/workout');
    revalidatePath('/dashboard');
    return { success: true, workoutId: newWorkout.id };
  } catch (error: any) {
    console.error("Action error:", error);
    return { error: error.message || "An unexpected error occurred" };
  }
}
