"use server"

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function logMeal(mealItems: any[], totalMacros: any, imageUrl?: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Not authenticated" };
    }

    const today = new Date().toISOString().split('T')[0];

    // 1. Get current meal number for today
    const { data: existingMeals, error: countError } = await supabase
      .from('meals')
      .select('meal_number')
      .eq('user_id', user.id)
      .eq('date', today)
      .order('meal_number', { ascending: false })
      .limit(1);
      
    if (countError) {
      console.error("Error fetching existing meals:", countError);
      return { error: "Failed to determine meal number" };
    }

    const mealNumber = existingMeals && existingMeals.length > 0 ? existingMeals[0].meal_number + 1 : 1;
    const mealName = `Meal ${mealNumber}`;

    // 2. Insert into meals
    const { data: newMeal, error: mealError } = await supabase
      .from('meals')
      .insert({
        user_id: user.id,
        date: today,
        meal_number: mealNumber,
        meal_name: mealName,
        total_calories: totalMacros.calories || 0,
        total_protein_g: totalMacros.protein_g || 0,
        total_carbs_g: totalMacros.carbs_g || 0,
        total_fat_g: totalMacros.fat_g || 0,
        total_fiber_g: totalMacros.fiber_g || 0,
        image_url: imageUrl || null
      })
      .select()
      .single();

    if (mealError || !newMeal) {
      console.error("Error inserting meal:", mealError);
      return { error: "Failed to log meal" };
    }

    // 3. Insert meal items
    const itemsToInsert = mealItems.map(item => ({
      meal_id: newMeal.id,
      user_id: user.id,
      food_name: item.food_name,
      quantity: item.quantity,
      unit: item.unit,
      calories: item.calories || 0,
      protein_g: item.protein_g || 0,
      carbs_g: item.carbs_g || 0,
      fat_g: item.fat_g || 0,
      fiber_g: item.fiber_g || 0,
      source: 'ai_scan',
      confidence: 0.9 
    }));

    const { error: itemsError } = await supabase
      .from('meal_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error("Error inserting meal items:", itemsError);
      return { error: "Failed to log meal items" };
    }

    // 4. Update daily summary
    const { data: summary } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    if (summary) {
      await supabase.from('daily_summaries').update({
        total_calories: Number(summary.total_calories) + Number(totalMacros.calories || 0),
        total_protein_g: Number(summary.total_protein_g) + Number(totalMacros.protein_g || 0),
        total_carbs_g: Number(summary.total_carbs_g) + Number(totalMacros.carbs_g || 0),
        total_fat_g: Number(summary.total_fat_g) + Number(totalMacros.fat_g || 0),
        meals_logged: Number(summary.meals_logged) + 1
      }).eq('id', summary.id);
    } else {
      const { data: goal } = await supabase.from('goals').select('id').eq('user_id', user.id).eq('is_active', true).single();
      
      await supabase.from('daily_summaries').insert({
        user_id: user.id,
        date: today,
        total_calories: totalMacros.calories || 0,
        total_protein_g: totalMacros.protein_g || 0,
        total_carbs_g: totalMacros.carbs_g || 0,
        total_fat_g: totalMacros.fat_g || 0,
        meals_logged: 1,
        goal_id: goal?.id
      });
    }

    revalidatePath('/dashboard');
    return { success: true, mealId: newMeal.id };
  } catch (error: any) {
    console.error("Action error:", error);
    return { error: error.message || "An unexpected error occurred" };
  }
}
