"use client";

import React, { useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function QuickLogModal({ date, goalId }: { date: string, goalId: string | undefined }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const [mealName, setMealName] = useState('Snack');
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName || !calories) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const numCals = parseFloat(calories) || 0;
      const numPro = parseFloat(protein) || 0;
      const numCarb = parseFloat(carbs) || 0;
      const numFat = parseFloat(fat) || 0;

      // Create meal
      const { data: meal, error: mealErr } = await supabase
        .from('meals')
        .insert({
          user_id: user.id,
          date,
          meal_name: mealName,
          total_calories: numCals,
          total_protein_g: numPro,
          total_carbs_g: numCarb,
          total_fat_g: numFat,
          total_fiber_g: 0,
        })
        .select()
        .single();
      
      if (mealErr) throw mealErr;

      // Create item
      await supabase.from('meal_items').insert({
        meal_id: meal.id,
        food_name: foodName,
        quantity: 1,
        unit: 'serving',
        calories: numCals,
        protein_g: numPro,
        carbs_g: numCarb,
        fat_g: numFat,
        fiber_g: 0
      });

      // Update daily summary
      const { data: summary } = await supabase
        .from('daily_summaries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', date)
        .single();

      if (summary) {
        await supabase.from('daily_summaries').update({
          total_calories: Number(summary.total_calories) + numCals,
          total_protein_g: Number(summary.total_protein_g) + numPro,
          total_carbs_g: Number(summary.total_carbs_g) + numCarb,
          total_fat_g: Number(summary.total_fat_g) + numFat,
          meals_logged: Number(summary.meals_logged) + 1
        }).eq('id', summary.id);
      } else {
        await supabase.from('daily_summaries').insert({
          user_id: user.id,
          date,
          total_calories: numCals,
          total_protein_g: numPro,
          total_carbs_g: numCarb,
          total_fat_g: numFat,
          meals_logged: 1,
          goal_id: goalId
        });
      }

      setIsOpen(false);
      setFoodName('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
      router.refresh();
    } catch (e) {
      alert("Failed to log meal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-xs font-semibold text-gray-400 hover:text-white transition-colors"
      >
        Manual Entry
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#12141c] border border-[#232738] rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">Quick Log</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <input
                  type="text"
                  required
                  placeholder="Food Name (e.g. 2 Boiled Eggs)"
                  value={foodName}
                  onChange={e => setFoodName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#181b26] border border-[#232738] rounded-xl text-white text-sm focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  required
                  placeholder="Calories"
                  value={calories}
                  onChange={e => setCalories(e.target.value)}
                  className="w-full px-3 py-2 bg-[#181b26] border border-[#232738] rounded-xl text-emerald-400 font-bold text-sm focus:border-emerald-500 outline-none"
                />
                <input
                  type="number"
                  placeholder="Protein (g)"
                  value={protein}
                  onChange={e => setProtein(e.target.value)}
                  className="w-full px-3 py-2 bg-[#181b26] border border-[#232738] rounded-xl text-blue-400 text-sm focus:border-blue-500 outline-none"
                />
                <input
                  type="number"
                  placeholder="Carbs (g)"
                  value={carbs}
                  onChange={e => setCarbs(e.target.value)}
                  className="w-full px-3 py-2 bg-[#181b26] border border-[#232738] rounded-xl text-amber-400 text-sm focus:border-amber-500 outline-none"
                />
                <input
                  type="number"
                  placeholder="Fat (g)"
                  value={fat}
                  onChange={e => setFat(e.target.value)}
                  className="w-full px-3 py-2 bg-[#181b26] border border-[#232738] rounded-xl text-rose-400 text-sm focus:border-rose-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-gray-950 font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Meal'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
