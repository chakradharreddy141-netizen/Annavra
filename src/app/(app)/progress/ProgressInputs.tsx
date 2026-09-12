"use client";

import React, { useState } from 'react';
import { Scale, Plus, Loader2, Settings } from 'lucide-react';
import { logWeight, updateStepTarget } from './actions';

export function WeightLogger({ todayWeight }: { todayWeight: number }) {
  const [weight, setWeight] = useState(todayWeight > 0 ? todayWeight.toString() : '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!weight) return;
    setIsSaving(true);
    await logWeight(parseFloat(weight));
    setIsSaving(false);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Scale className="h-4 w-4 text-gray-500" />
        </div>
        <input
          type="number"
          step="0.1"
          placeholder="Weight (kg)"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="w-full bg-[#181b26] border border-[#232738] rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:border-emerald-500 outline-none transition-colors"
        />
      </div>
      <button
        onClick={handleSave}
        disabled={isSaving || !weight}
        className="px-3 py-2 bg-[#232738] hover:bg-[#2a2f42] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
      >
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        Log
      </button>
    </div>
  );
}

export function StepTargetEditor({ currentTarget }: { currentTarget: number }) {
  const [target, setTarget] = useState(currentTarget.toString());
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!target) return;
    setIsSaving(true);
    await updateStepTarget(parseInt(target));
    setIsSaving(false);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="text-xs text-gray-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
      >
        <Settings className="w-3 h-3" /> Edit target
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        step="500"
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        className="w-24 bg-[#181b26] border border-[#232738] rounded-lg px-2 py-1 text-xs text-white focus:border-emerald-500 outline-none"
      />
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="text-xs text-emerald-400 font-semibold disabled:opacity-50"
      >
        {isSaving ? '...' : 'Save'}
      </button>
      <button onClick={() => setIsEditing(false)} className="text-xs text-gray-500">Cancel</button>
    </div>
  );
}
