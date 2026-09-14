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

  const [activeTab, setActiveTab] = useState<'manual' | 'saved'>('manual');
  const [savedMeals, setSavedMeals] = useState<any[]>([]);
  const [operationId, setOperationId] = useState<string>('');

  // Fetch saved meals when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setOperationId(crypto.randomUUID());
      const fetchSaved = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from('custom_meals').select('*').eq('user_id', user.id).order('name');
          if (data) setSavedMeals(data);
        }
      };
      fetchSaved();
    }
  }, [isOpen, supabase]);

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
      const { logMeal } = await import('@/app/(app)/scan/actions');
      const item = {
        food_name: foodName,
        quantity: 1,
        unit: 'serving',
        calories: parseFloat(calories) || 0,
        protein_g: parseFloat(protein) || 0,
        carbs_g: parseFloat(carbs) || 0,
        fat_g: parseFloat(fat) || 0,
        fiber_g: 0,
        nutrition_source: 'user_entered'
      };

      const result = await logMeal([item], operationId);
      if (result.error) throw new Error(result.error);

      setIsOpen(false);
      setFoodName('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("Failed to log meal");
    } finally {
      setLoading(false);
    }
  };

  const handleLogSaved = async (meal: any) => {
    setLoading(true);
    try {
      const { logMeal } = await import('@/app/(app)/scan/actions');
      const item = {
        food_name: meal.name,
        quantity: 1,
        unit: 'serving',
        calories: meal.calories,
        protein_g: meal.protein_g,
        carbs_g: meal.carbs_g,
        fat_g: meal.fat_g,
        fiber_g: meal.fiber_g,
        nutrition_source: 'user_entered'
      };

      const result = await logMeal([item], operationId);
      if (result.error) throw new Error(result.error);

      setIsOpen(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to log saved meal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="w-12 h-12 bg-[#ff4500] hover:bg-[#ff4500]/10 text-[#1a1a1a] rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95"
      >
        <Plus className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#ffffff] border border-[#1a1a1a]/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-[#1a1a1a]/10 flex items-center justify-between bg-[#fafafa]">
              <h3 className="font-bold text-[#1a1a1a] font-space">Quick Log</h3>
              <button onClick={() => setIsOpen(false)} className="p-1 text-[#6b7280] hover:text-[#1a1a1a] bg-[#ff4500]/10 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex border-b border-[#1a1a1a]/10 bg-[#fafafa]">
              <button 
                className={`flex-1 py-3 text-sm font-bold font-space text-center border-b-2 transition-colors ${activeTab === 'manual' ? 'border-[#ff4500] text-[#ff4500]' : 'border-transparent text-[#6b7280] hover:text-[#1a1a1a]'}`}
                onClick={() => setActiveTab('manual')}
              >
                Manual Entry
              </button>
              <button 
                className={`flex-1 py-3 text-sm font-bold font-space text-center border-b-2 transition-colors ${activeTab === 'saved' ? 'border-[#ff4500] text-[#ff4500]' : 'border-transparent text-[#6b7280] hover:text-[#1a1a1a]'}`}
                onClick={() => setActiveTab('saved')}
              >
                Saved Meals
              </button>
            </div>

            <div className="p-5 overflow-y-auto max-h-[60vh]">
              {activeTab === 'manual' ? (
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs text-[#6b7280] font-medium ml-1">Meal Type</label>
                    <select 
                      value={mealName}
                      onChange={(e) => setMealName(e.target.value)}
                      className="w-full bg-[#fafafa] border border-[#1a1a1a]/10 rounded-xl px-4 py-3 text-sm text-[#1a1a1a] outline-none focus:border-[#ff4500]"
                    >
                      <option value="Breakfast">Breakfast</option>
                      <option value="Lunch">Lunch</option>
                      <option value="Dinner">Dinner</option>
                      <option value="Snack">Snack</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#6b7280] font-medium ml-1">Food Description</label>
                    <input 
                      type="text" 
                      required
                      value={foodName}
                      onChange={(e) => setFoodName(e.target.value)}
                      placeholder="e.g. 2 Eggs & Toast"
                      className="w-full bg-[#fafafa] border border-[#1a1a1a]/10 rounded-xl px-4 py-3 text-sm text-[#1a1a1a] placeholder-gray-500 outline-none focus:border-[#ff4500]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#6b7280] font-medium ml-1">Total Calories</label>
                    <input 
                      type="number" 
                      required
                      value={calories}
                      onChange={(e) => setCalories(e.target.value)}
                      placeholder="Kcal"
                      className="w-full bg-[#fafafa] border border-[#1a1a1a]/10 rounded-xl px-4 py-3 text-sm text-[#1a1a1a] placeholder-gray-500 outline-none focus:border-[#ff4500]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase text-[#ff4500] font-medium ml-1">Protein (g)</label>
                      <input 
                        type="number" 
                        value={protein}
                        onChange={(e) => setProtein(e.target.value)}
                        placeholder="0"
                        className="w-full bg-[#fafafa] border border-[#1a1a1a]/10 rounded-xl px-3 py-2.5 text-sm text-[#1a1a1a] outline-none focus:border-[#ff4500]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase text-[#1a1a1a] font-medium ml-1">Carbs (g)</label>
                      <input 
                        type="number" 
                        value={carbs}
                        onChange={(e) => setCarbs(e.target.value)}
                        placeholder="0"
                        className="w-full bg-[#fafafa] border border-[#1a1a1a]/10 rounded-xl px-3 py-2.5 text-sm text-[#1a1a1a] outline-none focus:border-[#ff4500]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase text-[#10b981] font-medium ml-1">Fat (g)</label>
                      <input 
                        type="number" 
                        value={fat}
                        onChange={(e) => setFat(e.target.value)}
                        placeholder="0"
                        className="w-full bg-[#fafafa] border border-[#1a1a1a]/10 rounded-xl px-3 py-2.5 text-sm text-[#1a1a1a] outline-none focus:border-[#ff4500]"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={loading || !foodName || !calories}
                    className="w-full py-4 mt-2 btn-cyber text-[#1a1a1a] rounded-xl font-bold flex justify-center items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                    {loading ? 'Logging...' : 'Log Meal'}
                  </button>
                </form>
              ) : (
                <div className="space-y-3">
                  {savedMeals.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-sm text-[#6b7280] mb-4">No saved meals yet.</p>
                      <a href="/nutrition/custom" className="text-sm font-bold text-[#ff4500] hover:underline font-space">
                        Manage Saved Meals →
                      </a>
                    </div>
                  ) : (
                    <>
                      {savedMeals.map(meal => (
                        <button 
                          key={meal.id} 
                          onClick={() => handleLogSaved(meal)}
                          disabled={loading}
                          className="w-full text-left p-4 rounded-xl border border-[#1a1a1a]/10 bg-[#fafafa] hover:border-[#1a1a1a]/10 transition-colors disabled:opacity-50 disabled:pointer-events-none group"
                        >
                          <p className="font-bold text-[#1a1a1a] font-space group-hover:text-[#ff4500]">{meal.name}</p>
                          <div className="flex gap-3 text-xs text-[#6b7280] mt-1">
                            <span className="text-[#ff4500] font-bold">{meal.calories} kcal</span>
                            <span>P: {meal.protein_g}g</span>
                            <span>C: {meal.carbs_g}g</span>
                            <span>F: {meal.fat_g}g</span>
                          </div>
                        </button>
                      ))}
                      <div className="text-center mt-4">
                        <a href="/nutrition/custom" className="text-xs font-bold text-[#ff4500] hover:underline font-space">
                          Manage Saved Meals
                        </a>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
