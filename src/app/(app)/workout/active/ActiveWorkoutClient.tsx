"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Play, Square, Plus, Trash2, Check, Clock, Dumbbell, 
  ChevronDown, X, Loader2
} from 'lucide-react';
import { saveWorkout } from '../actions';
import Link from 'next/link';

type Exercise = {
  id: string;
  name: string;
  muscle_group: string;
};

type WorkoutSet = {
  id: string; // temp id for UI
  reps: string;
  weight_kg: string;
  isCompleted: boolean;
};

type ActiveExercise = {
  id: string; // temp id for UI
  exercise_id: string;
  exercise_name: string;
  sets: WorkoutSet[];
};

export default function ActiveWorkoutClient({ 
  exercises, 
  defaultWorkoutName 
}: { 
  exercises: Exercise[],
  defaultWorkoutName: string 
}) {
  const router = useRouter();
  
  // Timer state
  const [startTime] = useState(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  // Workout state
  const [workoutName, setWorkoutName] = useState(defaultWorkoutName);
  const [activeExercises, setActiveExercises] = useState<ActiveExercise[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // Modal state
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');

  // Update timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAddExercise = (exercise: Exercise) => {
    setActiveExercises([
      ...activeExercises,
      {
        id: Math.random().toString(36).substr(2, 9),
        exercise_id: exercise.id,
        exercise_name: exercise.name,
        sets: [
          { id: Math.random().toString(36).substr(2, 9), reps: '', weight_kg: '', isCompleted: false }
        ]
      }
    ]);
    setIsAddingExercise(false);
    setExerciseSearch('');
  };

  const handleAddSet = (exerciseIndex: number) => {
    const updated = [...activeExercises];
    const prevSet = updated[exerciseIndex].sets[updated[exerciseIndex].sets.length - 1];
    
    updated[exerciseIndex].sets.push({
      id: Math.random().toString(36).substr(2, 9),
      reps: prevSet ? prevSet.reps : '',
      weight_kg: prevSet ? prevSet.weight_kg : '',
      isCompleted: false
    });
    setActiveExercises(updated);
  };

  const handleUpdateSet = (exIndex: number, setIndex: number, field: 'reps' | 'weight_kg', value: string) => {
    const updated = [...activeExercises];
    updated[exIndex].sets[setIndex][field] = value;
    setActiveExercises(updated);
  };

  const handleToggleSet = (exIndex: number, setIndex: number) => {
    const updated = [...activeExercises];
    updated[exIndex].sets[setIndex].isCompleted = !updated[exIndex].sets[setIndex].isCompleted;
    setActiveExercises(updated);
  };

  const handleRemoveSet = (exIndex: number, setIndex: number) => {
    const updated = [...activeExercises];
    updated[exIndex].sets.splice(setIndex, 1);
    setActiveExercises(updated);
  };

  const handleRemoveExercise = (exIndex: number) => {
    const updated = [...activeExercises];
    updated.splice(exIndex, 1);
    setActiveExercises(updated);
  };

  const handleFinishWorkout = async () => {
    // Filter only completed sets
    const completedSets: any[] = [];
    
    activeExercises.forEach((ex) => {
      let setNum = 1;
      ex.sets.forEach((s) => {
        if (s.isCompleted && s.reps && s.weight_kg) {
          completedSets.push({
            exercise_id: ex.exercise_id,
            set_number: setNum++,
            reps: Number(s.reps),
            weight_kg: Number(s.weight_kg)
          });
        }
      });
    });

    if (completedSets.length === 0) {
      if (confirm("You haven't logged any completed sets. Discard workout?")) {
        router.push('/workout');
      }
      return;
    }

    setIsSaving(true);

    try {
      const res = await saveWorkout({
        workout_type: workoutName,
        name: workoutName,
        duration_minutes: Math.ceil(elapsedSeconds / 60),
        sets: completedSets
      });

      if (res.error) throw new Error(res.error);
      
      router.push('/workout');
    } catch (e) {
      alert("Failed to save workout");
      setIsSaving(false);
    }
  };

  const filteredExercises = exercises.filter(e => 
    e.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
    e.muscle_group.toLowerCase().includes(exerciseSearch.toLowerCase())
  );

  return (
    <div className="max-w-xl mx-auto min-h-screen bg-[#0b0c10] pb-32">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-[#0b0c10]/80 backdrop-blur-md border-b border-[#1a1a1a]/10 p-4 flex items-center justify-between">
        <div className="flex-1">
          <input
            type="text"
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            className="bg-transparent text-lg font-bold text-white outline-none w-full border-b border-transparent focus:border-emerald-500 transition-colors"
          />
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono mt-1">
            <Clock className="w-3.5 h-3.5" />
            {formatTime(elapsedSeconds)}
          </div>
        </div>
        <button
          onClick={handleFinishWorkout}
          disabled={isSaving}
          className="px-4 py-2 bg-emerald-500 text-gray-950 font-bold text-sm rounded-xl hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4 fill-current" />}
          Finish
        </button>
      </div>

      <div className="p-4 space-y-6">
        {activeExercises.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-[#1a1a1a]/10 rounded-2xl bg-[#ffffff]/50">
            <div className="w-12 h-12 rounded-full bg-[#fafafa] flex items-center justify-center mx-auto mb-3">
              <Dumbbell className="w-5 h-5 text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-300">Empty Workout</p>
            <p className="text-xs text-gray-500 mt-1 mb-4">Add your first exercise to begin tracking.</p>
            <button
              onClick={() => setIsAddingExercise(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#fafafa] hover:bg-[#202433] border border-[#1a1a1a]/10 text-emerald-400 text-xs font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Exercise
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {activeExercises.map((ex, exIndex) => (
              <div key={ex.id} className="bg-[#fafafa] border border-[#1a1a1a]/10 rounded-2xl overflow-hidden">
                <div className="p-3 bg-[#1f2331]/50 border-b border-[#1a1a1a]/10 flex items-center justify-between">
                  <h3 className="font-bold text-emerald-400 text-sm">{ex.exercise_name}</h3>
                  <button onClick={() => handleRemoveExercise(exIndex)} className="text-gray-500 hover:text-red-400 p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="p-3 space-y-2">
                  {/* Headers */}
                  <div className="flex text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-2">
                    <div className="w-10 text-center">Set</div>
                    <div className="flex-1 text-center">kg</div>
                    <div className="flex-1 text-center">Reps</div>
                    <div className="w-12 text-center">Done</div>
                  </div>

                  {ex.sets.map((set, setIndex) => (
                    <div 
                      key={set.id} 
                      className={`flex items-center p-1.5 rounded-lg transition-colors ${set.isCompleted ? 'bg-emerald-500/10' : 'bg-[#ffffff]'}`}
                    >
                      <div className="w-10 text-center text-xs font-bold text-gray-400">
                        {setIndex + 1}
                      </div>
                      <div className="flex-1 px-1 flex items-center bg-[#fafafa] rounded">
                        <button 
                          disabled={set.isCompleted} 
                          onClick={() => handleUpdateSet(exIndex, setIndex, 'weight_kg', Math.max(0, (parseFloat(set.weight_kg) || 0) - 2.5).toString())} 
                          className="px-1 text-gray-500 hover:text-white disabled:opacity-50"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          placeholder="0"
                          value={set.weight_kg}
                          onChange={(e) => handleUpdateSet(exIndex, setIndex, 'weight_kg', e.target.value)}
                          disabled={set.isCompleted}
                          className="w-full text-center bg-transparent font-semibold text-white outline-none focus:bg-[#1f2331] rounded py-1 disabled:opacity-70 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button 
                          disabled={set.isCompleted} 
                          onClick={() => handleUpdateSet(exIndex, setIndex, 'weight_kg', ((parseFloat(set.weight_kg) || 0) + 2.5).toString())} 
                          className="px-1 text-gray-500 hover:text-white disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex-1 px-1 flex items-center bg-[#fafafa] rounded">
                        <button 
                          disabled={set.isCompleted} 
                          onClick={() => handleUpdateSet(exIndex, setIndex, 'reps', Math.max(0, (parseInt(set.reps) || 0) - 1).toString())} 
                          className="px-1 text-gray-500 hover:text-white disabled:opacity-50"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          placeholder="0"
                          value={set.reps}
                          onChange={(e) => handleUpdateSet(exIndex, setIndex, 'reps', e.target.value)}
                          disabled={set.isCompleted}
                          className="w-full text-center bg-transparent font-semibold text-white outline-none focus:bg-[#1f2331] rounded py-1 disabled:opacity-70 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button 
                          disabled={set.isCompleted} 
                          onClick={() => handleUpdateSet(exIndex, setIndex, 'reps', ((parseInt(set.reps) || 0) + 1).toString())} 
                          className="px-1 text-gray-500 hover:text-white disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>
                      <div className="w-12 flex justify-center">
                        <button
                          onClick={() => handleToggleSet(exIndex, setIndex)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                            set.isCompleted 
                              ? 'bg-emerald-500 text-gray-950 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                              : 'bg-[#232738] text-gray-400 hover:bg-[#2a2f42]'
                          }`}
                        >
                          <Check className={`w-4 h-4 ${set.isCompleted ? 'stroke-[3]' : ''}`} />
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => handleAddSet(exIndex)}
                    className="w-full py-2 mt-2 flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white hover:bg-[#232738] transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Set
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={() => setIsAddingExercise(true)}
              className="w-full py-4 flex items-center justify-center gap-2 border-2 border-dashed border-[#1a1a1a]/10 rounded-xl text-emerald-400 hover:text-emerald-300 hover:bg-[#fafafa] transition-colors font-semibold"
            >
              <Plus className="w-5 h-5" /> Add Another Exercise
            </button>
          </div>
        )}
      </div>

      {/* Add Exercise Modal */}
      {isAddingExercise && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#ffffff] border border-[#1a1a1a]/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-[#1a1a1a]/10 flex items-center justify-between">
              <h3 className="font-bold text-white">Select Exercise</h3>
              <button onClick={() => setIsAddingExercise(false)} className="p-1 text-gray-400 hover:text-white bg-[#fafafa] rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 border-b border-[#1a1a1a]/10 bg-[#0b0c10]">
              <input
                type="text"
                placeholder="Search exercises..."
                value={exerciseSearch}
                onChange={(e) => setExerciseSearch(e.target.value)}
                className="w-full bg-[#fafafa] border border-[#1a1a1a]/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-emerald-500"
                autoFocus
              />
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {filteredExercises.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-gray-500 mb-4">No exercises found.</p>
                  {exerciseSearch.trim().length > 0 && (
                    <button
                      onClick={() => handleAddExercise({ id: crypto.randomUUID(), name: exerciseSearch.trim(), muscle_group: 'Custom' })}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl hover:bg-emerald-500/20 font-medium text-sm transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Create &quot;{exerciseSearch.trim()}&quot;
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {filteredExercises.map(ex => (
                  <button
                    key={ex.id}
                    onClick={() => handleAddExercise(ex)}
                    className="w-full text-left p-3 hover:bg-[#fafafa] rounded-xl flex justify-between items-center group transition-colors"
                  >
                    <div>
                      <div className="font-medium text-gray-200 group-hover:text-emerald-400 transition-colors">{ex.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{ex.muscle_group}</div>
                    </div>
                    <Plus className="w-4 h-4 text-gray-500 group-hover:text-emerald-400" />
                  </button>
                  ))}
                  
                  {/* Option to create custom if not exactly matching any result */}
                  {exerciseSearch.trim().length > 0 && !filteredExercises.some(e => e.name.toLowerCase() === exerciseSearch.trim().toLowerCase()) && (
                    <div className="mt-4 pt-4 border-t border-[#1a1a1a]/10 text-center">
                      <p className="text-xs text-gray-500 mb-2">Don&apos;t see what you&apos;re looking for?</p>
                      <button
                        onClick={() => handleAddExercise({ id: crypto.randomUUID(), name: exerciseSearch.trim(), muscle_group: 'Custom' })}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl hover:bg-emerald-500/20 font-medium text-sm transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Create &quot;{exerciseSearch.trim()}&quot;
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
