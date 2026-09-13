'use client';

import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { createCustomExercise } from '../actions';

interface CustomExerciseModalProps {
  initialName: string;
  onClose: () => void;
  onSuccess: (exercise: any) => void;
}

const MUSCLE_OPTIONS = [
  { id: 'chest', label: 'Chest' },
  { id: 'back-deltoids', label: 'Rear Delts' },
  { id: 'front-deltoids', label: 'Front Delts' },
  { id: 'biceps', label: 'Biceps' },
  { id: 'triceps', label: 'Triceps' },
  { id: 'forearm', label: 'Forearms' },
  { id: 'upper-back', label: 'Upper Back / Lats' },
  { id: 'lower-back', label: 'Lower Back' },
  { id: 'trapezius', label: 'Traps' },
  { id: 'abs', label: 'Abs' },
  { id: 'obliques', label: 'Obliques' },
  { id: 'gluteal', label: 'Glutes' },
  { id: 'quadriceps', label: 'Quads' },
  { id: 'hamstring', label: 'Hamstrings' },
  { id: 'calves', label: 'Calves' },
  { id: 'abductors', label: 'Abductors' },
  { id: 'adductors', label: 'Adductors' }
];

export default function CustomExerciseModal({ initialName, onClose, onSuccess }: CustomExerciseModalProps) {
  const [name, setName] = useState(initialName);
  const [primary, setPrimary] = useState<string[]>([]);
  const [secondary, setSecondary] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleMuscle = (muscleId: string, type: 'primary' | 'secondary') => {
    if (type === 'primary') {
      setPrimary(prev => prev.includes(muscleId) ? prev.filter(m => m !== muscleId) : [...prev, muscleId]);
      // Remove from secondary if it's there
      setSecondary(prev => prev.filter(m => m !== muscleId));
    } else {
      setSecondary(prev => prev.includes(muscleId) ? prev.filter(m => m !== muscleId) : [...prev, muscleId]);
      // Remove from primary if it's there
      setPrimary(prev => prev.filter(m => m !== muscleId));
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    const res = await createCustomExercise(name.trim(), primary, secondary);
    
    if (res.error || !res.exercise) {
      setError(res.error || "Failed to create exercise");
      setIsSubmitting(false);
    } else {
      onSuccess(res.exercise);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1a1a1a]/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#ffffff] border border-[#1a1a1a]/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="p-4 border-b border-[#1a1a1a]/10 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="font-bold text-[#1a1a1a] font-space text-lg">Create Custom Exercise</h3>
          <button onClick={onClose} className="p-1.5 text-[#6b7280] hover:text-[#1a1a1a] hover:bg-[#fafafa] rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 overflow-y-auto space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#1a1a1a]">Exercise Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#fafafa] border border-[#1a1a1a]/10 rounded-xl px-4 py-3 text-[#1a1a1a] font-medium outline-none focus:border-[#ff4500] transition-colors"
              placeholder="e.g. Zercher Squats"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-[#1a1a1a]">Primary Muscles</label>
              <span className="text-xs text-[#6b7280]">Select main drivers</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {MUSCLE_OPTIONS.map(m => (
                <button
                  key={`p-${m.id}`}
                  onClick={() => toggleMuscle(m.id, 'primary')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    primary.includes(m.id) 
                      ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' 
                      : 'bg-white text-[#6b7280] border-[#1a1a1a]/10 hover:border-[#1a1a1a]/30'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-[#1a1a1a]">Secondary Muscles</label>
              <span className="text-xs text-[#6b7280]">Select assisting</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {MUSCLE_OPTIONS.map(m => (
                <button
                  key={`s-${m.id}`}
                  onClick={() => toggleMuscle(m.id, 'secondary')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    secondary.includes(m.id) 
                      ? 'bg-[#ff4500] text-white border-[#ff4500]' 
                      : 'bg-white text-[#6b7280] border-[#1a1a1a]/10 hover:border-[#1a1a1a]/30'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-[#1a1a1a]/10 bg-[#fafafa] sticky bottom-0">
          <button 
            onClick={handleSave}
            disabled={isSubmitting || !name.trim()}
            className="w-full py-3.5 bg-[#ff4500] hover:bg-[#e63e00] text-white rounded-xl font-bold font-space transition-colors active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex justify-center items-center gap-2 shadow-lg shadow-[#ff4500]/20"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Exercise'}
          </button>
        </div>
        
      </div>
    </div>
  );
}
