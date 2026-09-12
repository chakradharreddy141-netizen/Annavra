"use client";

import React, { useState } from 'react';
import { Footprints, Plus, Loader2 } from 'lucide-react';
import { logSteps } from './actions';

export function StepLogger({ todaySteps }: { todaySteps: number }) {
  const [steps, setSteps] = useState(todaySteps > 0 ? todaySteps.toString() : '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!steps) return;
    setIsSaving(true);
    await logSteps(parseInt(steps));
    setIsSaving(false);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Footprints className="h-4 w-4 text-[#6b7280]" />
        </div>
        <input
          type="number"
          placeholder="Steps today"
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          className="w-full bg-[#fafafa] border border-[#1a1a1a]/10 rounded-xl pl-9 pr-4 py-2 text-sm text-[#1a1a1a] focus:border-blue-500 outline-none transition-colors"
        />
      </div>
      <button
        onClick={handleSave}
        disabled={isSaving || !steps}
        className="px-3 py-2 bg-[#232738] hover:bg-[#2a2f42] text-[#1a1a1a] rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
      >
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        Log
      </button>
    </div>
  );
}
