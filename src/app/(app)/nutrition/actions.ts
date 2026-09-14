"use server"

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteMeal(mealId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Not authenticated" };
    }

    // Fetch the meal to get its date and macros before deleting
    const { data: meal, error: fetchError } = await supabase
      .from('meals')
      .select('*')
      .eq('id', mealId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !meal) {
      return { error: "Meal not found or unauthorized" };
    }

    // Delete the meal (cascading will delete meal_items)
    const { error: deleteError } = await supabase
      .from('meals')
      .delete()
      .eq('id', mealId)
      .eq('user_id', user.id);

    if (deleteError) {
      return { error: "Failed to delete meal" };
    }

    // Recalculate daily summary via RPC
    await supabase.rpc('recalculate_daily_summary', {
      p_date: meal.date
    });

    revalidatePath('/nutrition');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error("Delete meal error:", error);
    return { error: error.message || "An unexpected error occurred" };
  }
}
