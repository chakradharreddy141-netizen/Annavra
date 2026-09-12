"use server"

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function logSteps(steps: number) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Not authenticated" };
    }

    const today = new Date().toISOString().split('T')[0];

    // Upsert into step_entries
    const { error: stepError } = await supabase
      .from('step_entries')
      .upsert(
        { user_id: user.id, date: today, steps: steps },
        { onConflict: 'user_id, date' }
      );

    if (stepError) throw stepError;

    // Update daily_summaries
    const { data: summary } = await supabase
      .from('daily_summaries')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    if (summary) {
      await supabase.from('daily_summaries').update({ steps: steps }).eq('id', summary.id);
    } else {
      const { data: goal } = await supabase.from('goals').select('id').eq('user_id', user.id).eq('is_active', true).single();
      await supabase.from('daily_summaries').insert({
        user_id: user.id,
        date: today,
        steps: steps,
        goal_id: goal?.id
      });
    }

    revalidatePath('/progress');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error("Log steps error:", error);
    return { error: error.message || "Failed to log steps" };
  }
}

export async function updateStepTarget(target: number) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Not authenticated" };
    }

    const { error } = await supabase
      .from('profiles')
      .update({ daily_step_target: target })
      .eq('id', user.id);

    if (error) throw error;

    revalidatePath('/progress');
    revalidatePath('/profile');
    return { success: true };
  } catch (error: any) {
    console.error("Update step target error:", error);
    return { error: error.message || "Failed to update step target" };
  }
}

export async function logWeight(weight: number) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Not authenticated" };
    }

    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase
      .from('weight_entries')
      .upsert(
        { user_id: user.id, date: today, weight_kg: weight, notes: 'Logged from progress page' },
        { onConflict: 'user_id, date' }
      );

    if (error) throw error;

    revalidatePath('/progress');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error("Log weight error:", error);
    return { error: error.message || "Failed to log weight" };
  }
}
