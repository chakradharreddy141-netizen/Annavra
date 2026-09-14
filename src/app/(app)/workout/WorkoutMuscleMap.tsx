'use client';

import React, { useMemo } from 'react';
import Model from 'react-body-highlighter';

import { ErrorBoundary } from '@/components/ErrorBoundary';

// We want to pass an array of objects to react-body-highlighter.
// Example: { name: 'Bench Press', muscles: ['chest', 'triceps', 'front-deltoids'] }
// For the 2-layer logic:
// - Planned layer (split-based): we pretend there's one "Planned" exercise with all the primary muscles of the split.
// - Actual layer (logged-sets-based): we feed actual exercises. If they exist, we don't feed the "Planned" one to override it.

interface WorkoutMuscleMapProps {
  workoutType: string;
  loggedExercises: {
    id: string;
    name: string;
    primary_muscles: string[];
    secondary_muscles: string[];
    setsCount: number;
  }[];
}

// Typical muscles targeted in standard splits (for the planned layer)
const splitMap: Record<string, string[]> = {
  'Push': ['chest', 'front-deltoids', 'triceps'],
  'Pull': ['upper-back', 'lower-back', 'trapezius', 'back-deltoids', 'biceps'],
  'Legs': ['quadriceps', 'hamstring', 'gluteal', 'calves'],
  'Upper Body': ['chest', 'upper-back', 'front-deltoids', 'back-deltoids', 'triceps', 'biceps'],
  'Lower Body': ['quadriceps', 'hamstring', 'gluteal', 'calves'],
  'Full Body': ['chest', 'upper-back', 'quadriceps', 'hamstring', 'gluteal', 'front-deltoids'],
  'Cardio': ['calves', 'hamstring', 'quadriceps'],
  'Rest': []
};

export default function WorkoutMuscleMap({ workoutType, loggedExercises }: WorkoutMuscleMapProps) {
  const plannedData = useMemo(() => {
    const plannedMuscles = splitMap[workoutType] || [];
    if (plannedMuscles.length > 0) {
      return [{
        name: 'Planned Split',
        muscles: plannedMuscles
      }];
    }
    return [];
  }, [workoutType]);

  const actualData = useMemo(() => {
    const result: any[] = [];
    if (loggedExercises && loggedExercises.length > 0) {
      loggedExercises.forEach(ex => {
        // Always add at least one entry so the muscle highlights just by adding the exercise
        const iterations = Math.max(1, ex.setsCount);
        for (let i = 0; i < iterations; i++) {
          result.push({
            name: `${ex.name} - Set ${i + 1} (Primary)`,
            muscles: (ex.primary_muscles || []).map(m => m === 'hamstrings' ? 'hamstring' : m)
          });
          
          if (i === 0 || i === 2) {
             result.push({
               name: `${ex.name} - Set ${i + 1} (Secondary)`,
               muscles: (ex.secondary_muscles || []).map(m => m === 'hamstrings' ? 'hamstring' : m)
             });
          }
        }
      });
    }
    return result;
  }, [loggedExercises]);

  const highlightedColors = [
    'rgba(255, 69, 0, 0.3)', // Low
    'rgba(255, 69, 0, 0.6)', // Medium
    'rgba(255, 69, 0, 0.9)', // High
    '#ff4500'                // Max
  ];

  return (
    <ErrorBoundary fallback={
      <div className="flex flex-col items-center justify-center p-4 bg-[#fafafa] rounded-2xl border border-[#1a1a1a]/10 min-h-[200px]">
        <p className="text-[#a1a1aa] font-medium text-sm">Muscle map temporarily unavailable</p>
      </div>
    }>
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center p-4 bg-[#fafafa] rounded-2xl border border-[#1a1a1a]/10 pointer-events-none">
        
        {/* Anterior */}
        <div className="w-1/2 relative flex justify-center items-center aspect-[1/2] max-h-[300px]">
          {/* Base Layer (Planned) */}
          <div className="absolute inset-0 flex justify-center items-center opacity-30">
            <Model 
              type="anterior" 
              data={plannedData as any} 
              highlightedColors={['#6b7280']} 
              bodyColor="#e5e7eb" 
              style={{ width: '100%', height: '100%', padding: '10px' }}
            />
          </div>
          {/* Overlay Layer (Actual) */}
          <div className="relative z-10 w-full h-full flex justify-center items-center">
            <Model 
              type="anterior" 
              data={actualData as any} 
              highlightedColors={highlightedColors}
              bodyColor="transparent"
              style={{ width: '100%', height: '100%', padding: '10px' }}
            />
          </div>
        </div>

        {/* Posterior */}
        <div className="w-1/2 relative flex justify-center items-center aspect-[1/2] max-h-[300px]">
          {/* Base Layer (Planned) */}
          <div className="absolute inset-0 flex justify-center items-center opacity-30">
            <Model 
              type="posterior" 
              data={plannedData as any} 
              highlightedColors={['#6b7280']} 
              bodyColor="#e5e7eb" 
              style={{ width: '100%', height: '100%', padding: '10px' }}
            />
          </div>
          {/* Overlay Layer (Actual) */}
          <div className="relative z-10 w-full h-full flex justify-center items-center">
            <Model 
              type="posterior" 
              data={actualData as any} 
              highlightedColors={highlightedColors}
              bodyColor="transparent"
              style={{ width: '100%', height: '100%', padding: '10px' }}
            />
          </div>
        </div>

      </div>
    </ErrorBoundary>
  );
}
