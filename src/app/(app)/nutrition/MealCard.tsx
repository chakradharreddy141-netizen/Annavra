"use client";

import React, { useState } from 'react';
import { Trash2, ChevronDown, ChevronUp, Clock, AlertTriangle } from 'lucide-react';
import { deleteMeal } from './actions';

export default function MealCard({ meal, items }: { meal: any, items: any[] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this meal?")) {
      setIsDeleting(true);
      await deleteMeal(meal.id);
      setIsDeleting(false);
    }
  };

  return (
    <div className="cyber-panel cyber-panel-hover rounded-2xl overflow-hidden transition-all">
      <div 
        className="p-4 flex items-center justify-between cursor-pointer transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <div className="font-semibold text-[#f3f4f6] font-space">{meal.meal_name}</div>
          <div className="text-xs text-[#9ca3af] mt-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {new Date(meal.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="font-bold text-[#00f0ff] glow-cyan font-space">{Math.round(meal.total_calories)} kcal</div>
            <div className="text-[11px] text-[#9ca3af] mt-1">
              {Math.round(meal.total_protein_g)}P &bull; {Math.round(meal.total_carbs_g)}C &bull; {Math.round(meal.total_fat_g)}F
            </div>
          </div>
          <div className="text-[#9ca3af]">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-[#00f0ff]/10 pt-4 bg-[#07080b]/50">
          {items.length > 0 ? (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <div>
                    <div className="font-medium text-[#f3f4f6]">{item.food_name}</div>
                    <div className="text-xs text-[#9ca3af] mt-0.5">{item.quantity} {item.unit}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-[#00f0ff] font-space">{Math.round(item.calories)} kcal</div>
                    <div className="text-[10px] text-[#9ca3af]">
                      {Math.round(item.protein_g)}p {Math.round(item.carbs_g)}c {Math.round(item.fat_g)}f
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-[#9ca3af] italic py-2">No individual items recorded for this meal.</div>
          )}

          <div className="mt-5 pt-4 border-t border-[#00f0ff]/10 flex justify-end">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#ef4444] hover:text-[#ef4444]/80 hover:bg-[#ef4444]/10 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? 'Deleting...' : 'Delete Meal'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
