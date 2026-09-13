"use server"

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getUserLocalDate } from "@/lib/date";

export async function logMeal(mealItems: any[], imageUrl?: string) {
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
    
    // 2. Generate local date
    const localDate = getUserLocalDate(tz);

    // 3. Ensure items are formatted properly for JSONB
    const itemsJson = mealItems.map(item => ({
      food_name: item.food_name || 'Unknown',
      quantity: Number(item.quantity) || 1,
      unit: item.unit || 'serving',
      calories: Number(item.calories) || 0,
      protein_g: Number(item.protein_g) || 0,
      carbs_g: Number(item.carbs_g) || 0,
      fat_g: Number(item.fat_g) || 0,
      fiber_g: Number(item.fiber_g) || 0,
      nutrition_source: 'ai'
    }));

    // 4. Call RPC Transaction
    const { data: mealId, error: rpcError } = await supabase.rpc('log_meal_transaction', {
      p_date: localDate,
      p_meal_name: 'AI Scan', 
      p_items: itemsJson
    });

    if (rpcError) {
      console.error("Error from log_meal_transaction:", rpcError);
      return { error: rpcError.message || "Failed to log meal transaction" };
    }
    
    // 5. Update image url if needed
    if (imageUrl && mealId) {
       await supabase.from('meals').update({ image_url: imageUrl }).eq('id', mealId);
    }

    revalidatePath('/dashboard');
    return { success: true, mealId };
  } catch (error: any) {
    console.error("Action error:", error);
    return { error: error.message || "An unexpected error occurred" };
  }
}
