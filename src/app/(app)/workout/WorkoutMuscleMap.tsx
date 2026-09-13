'use client';

import React, { useMemo } from 'react';
import Model from 'react-body-highlighter';

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
  'Legs': ['quadriceps', 'hamstrings', 'gluteal', 'calves'],
  'Upper Body': ['chest', 'upper-back', 'front-deltoids', 'back-deltoids', 'triceps', 'biceps'],
  'Lower Body': ['quadriceps', 'hamstrings', 'gluteal', 'calves'],
  'Full Body': ['chest', 'upper-back', 'quadriceps', 'hamstrings', 'gluteal', 'front-deltoids'],
  'Cardio': ['calves', 'hamstrings', 'quadriceps'],
  'Rest': []
};

export default function WorkoutMuscleMap({ workoutType, loggedExercises }: WorkoutMuscleMapProps) {
  const data = useMemo(() => {
    const result: any[] = [];

    if (loggedExercises && loggedExercises.length > 0) {
      // Actual Layer: Feed the real logged exercises. 
      // We pass the primary muscles multiple times depending on setsCount to increase intensity.
      // E.g. if 3 sets, we can add 3 dummy exercise entries to increase frequency.
      
      loggedExercises.forEach(ex => {
        // primary -> full intensity
        // secondary -> medium intensity
        
        for (let i = 0; i < ex.setsCount; i++) {
          result.push({
            name: `${ex.name} - Set ${i + 1} (Primary)`,
            muscles: ex.primary_muscles || []
          });
          
          // Only add secondary muscles for some sets to keep them at a lower intensity
          if (i === 0 || i === 2) {
             result.push({
               name: `${ex.name} - Set ${i + 1} (Secondary)`,
               muscles: ex.secondary_muscles || []
             });
          }
        }
      });

    } else {
      // Planned Layer: Only if no exercises logged yet
      const plannedMuscles = splitMap[workoutType] || [];
      if (plannedMuscles.length > 0) {
        result.push({
          name: 'Planned Split',
          muscles: plannedMuscles
        });
      }
    }

    return result;
  }, [workoutType, loggedExercises]);

  // Accent colors for intensities (frequency - 1 = index)
  // 1 hit: very light orange
  // 2 hits: light orange
  // 3 hits: solid orange
  // 4+ hits: deep orange/red
  const highlightedColors = [
    'rgba(255, 69, 0, 0.3)', // Low
    'rgba(255, 69, 0, 0.6)', // Medium
    'rgba(255, 69, 0, 0.9)', // High
    '#ff4500'                // Max
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-center p-4 bg-[#fafafa] rounded-2xl border border-[#1a1a1a]/10">
      <div className="w-1/2 flex justify-center">
        <Model 
          type="anterior" 
          data={data} 
          highlightedColors={highlightedColors}
          bodyColor="#e5e7eb" // Tailwind gray-200
          style={{ width: '100%', maxWidth: '200px' }}
        />
      </div>
      <div className="w-1/2 flex justify-center">
        <Model 
          type="posterior" 
          data={data} 
          highlightedColors={highlightedColors}
          bodyColor="#e5e7eb"
          style={{ width: '100%', maxWidth: '200px' }}
        />
      </div>
    </div>
  );
}
