import React from 'react';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ArrowLeft, Trash2, Plus } from 'lucide-react';
import { revalidatePath } from 'next/cache';

export default async function CustomMealsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: customMeals } = await supabase
    .from('custom_meals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  async function deleteMeal(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const sb = await createClient();
    await sb.from('custom_meals').delete().eq('id', id);
    revalidatePath('/nutrition/custom');
  }

  async function createMeal(formData: FormData) {
    'use server';
    const name = formData.get('name') as string;
    const calories = parseFloat(formData.get('calories') as string) || 0;
    const protein_g = parseFloat(formData.get('protein_g') as string) || 0;
    const carbs_g = parseFloat(formData.get('carbs_g') as string) || 0;
    const fat_g = parseFloat(formData.get('fat_g') as string) || 0;

    const sb = await createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (user) {
      await sb.from('custom_meals').insert({
        user_id: user.id,
        name,
        calories,
        protein_g,
        carbs_g,
        fat_g
      });
      revalidatePath('/nutrition/custom');
    }
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-4 pb-24 space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/nutrition" className="p-2 -ml-2 rounded-xl text-[#6b7280] hover:text-[#ff4500] hover:bg-[#ff4500]/10 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold text-[#1a1a1a] font-space">Saved Meals</h1>
        <div className="w-9" />
      </div>

      <div className="cyber-panel rounded-2xl p-5 mb-8">
        <h2 className="text-sm font-bold text-[#ff4500] mb-4 font-space">Create New</h2>
        <form action={createMeal} className="space-y-4">
          <input 
            name="name" 
            required 
            placeholder="Meal Name (e.g. Morning Protein Shake)" 
            className="w-full bg-[#0b0c10] border border-[#1a1a1a]/10 rounded-xl px-4 py-3 text-sm text-[#1a1a1a] focus:border-[#1a1a1a]/10 outline-none"
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <input name="calories" required type="number" placeholder="Kcal" className="w-full bg-[#0b0c10] border border-[#1a1a1a]/10 rounded-xl px-4 py-3 text-sm text-[#1a1a1a] focus:border-[#1a1a1a]/10 outline-none" />
            <input name="protein_g" type="number" placeholder="Pro (g)" className="w-full bg-[#0b0c10] border border-[#1a1a1a]/10 rounded-xl px-4 py-3 text-sm text-[#1a1a1a] focus:border-[#1a1a1a]/10 outline-none" />
            <input name="carbs_g" type="number" placeholder="Carb (g)" className="w-full bg-[#0b0c10] border border-[#1a1a1a]/10 rounded-xl px-4 py-3 text-sm text-[#1a1a1a] focus:border-[#1a1a1a]/10 outline-none" />
            <input name="fat_g" type="number" placeholder="Fat (g)" className="w-full bg-[#0b0c10] border border-[#1a1a1a]/10 rounded-xl px-4 py-3 text-sm text-[#1a1a1a] focus:border-[#1a1a1a]/10 outline-none" />
          </div>
          <button type="submit" className="w-full py-3 btn-cyber text-[#1a1a1a] rounded-xl font-bold flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" /> Save Meal
          </button>
        </form>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-bold text-[#1a1a1a] font-space mb-2">Your Saved Meals</h2>
        {(!customMeals || customMeals.length === 0) ? (
          <p className="text-sm text-[#6b7280]">No saved meals yet.</p>
        ) : (
          customMeals.map(meal => (
            <div key={meal.id} className="cyber-panel rounded-xl p-4 flex items-center justify-between group">
              <div>
                <p className="font-bold text-[#1a1a1a] font-space">{meal.name}</p>
                <div className="flex gap-3 text-xs text-[#6b7280] mt-1">
                  <span className="text-[#ff4500] font-bold">{meal.calories} kcal</span>
                  <span>P: {meal.protein_g}g</span>
                  <span>C: {meal.carbs_g}g</span>
                  <span>F: {meal.fat_g}g</span>
                </div>
              </div>
              <form action={deleteMeal}>
                <input type="hidden" name="id" value={meal.id} />
                <button type="submit" className="p-2 text-[#6b7280] hover:text-[#ef4444] hover:bg-[#ef4444]/10 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </form>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
