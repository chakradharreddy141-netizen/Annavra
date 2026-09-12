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

    // Update daily summary
    const { data: summary } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', meal.date)
      .single();

    if (summary) {
      await supabase.from('daily_summaries').update({
        total_calories: Math.max(0, Number(summary.total_calories) - Number(meal.total_calories)),
        total_protein_g: Math.max(0, Number(summary.total_protein_g) - Number(meal.total_protein_g)),
        total_carbs_g: Math.max(0, Number(summary.total_carbs_g) - Number(meal.total_carbs_g)),
        total_fat_g: Math.max(0, Number(summary.total_fat_g) - Number(meal.total_fat_g)),
        meals_logged: Math.max(0, Number(summary.meals_logged) - 1)
      }).eq('id', summary.id);
    }

    revalidatePath('/nutrition');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error("Delete meal error:", error);
    return { error: error.message || "An unexpected error occurred" };
  }
}
