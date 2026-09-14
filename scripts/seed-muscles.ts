import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Disambiguation table for free-exercise-db -> react-body-highlighter
 */
const muscleMap: Record<string, string> = {
  'lats': 'upper-back',
  'middle back': 'upper-back',
  'lower back': 'lower-back',
  'abductors': 'gluteal', // Fold into gluteal
  'adductors': 'adductor',
  'glutes': 'gluteal',
  'traps': 'trapezius',
  'forearms': 'forearm',
  'hamstrings': 'hamstrings',
  'quadriceps': 'quadriceps',
  'calves': 'calves',
  'chest': 'chest',
  'biceps': 'biceps',
  'triceps': 'triceps',
  'abdominals': 'abs',
  'neck': 'neck',
  'head': 'head'
};

// Patterns for "shoulders" disambiguation
const frontDeltPatterns = ['bench press', 'overhead press', 'military press', 'front raise', 'arnold press', 'push press', 'lateral raise'];
const backDeltPatterns = ['rear delt', 'face pull', 'reverse fly', 'pull-up', 'pulldown', 'row'];

function mapMuscles(muscles: string[], exerciseName: string): string[] {
  if (!muscles) return [];
  
  const mapped = new Set<string>();
  
  for (const m of muscles) {
    const lower = m.toLowerCase();
    
    if (lower === 'shoulders') {
      const name = exerciseName.toLowerCase();
      // Disambiguate shoulders
      const isFront = frontDeltPatterns.some(p => name.includes(p));
      const isBack = backDeltPatterns.some(p => name.includes(p));
      
      if (isFront && isBack) {
        mapped.add('front-deltoids');
        mapped.add('back-deltoids');
      } else if (isBack) {
        mapped.add('back-deltoids');
      } else {
        // Default to front-deltoids for pressing/raising
        mapped.add('front-deltoids');
      }
    } else if (muscleMap[lower]) {
      mapped.add(muscleMap[lower]);
    } else {
      console.warn(`Unmapped muscle: ${lower} in ${exerciseName}`);
    }
  }
  
  return Array.from(mapped);
}

async function run() {
  console.log('Fetching free-exercise-db...');
  const res = await fetch('https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json');
  const externalData: any[] = await res.json();
  
  console.log(`Fetched ${externalData.length} exercises. Processing mapping...`);
  
  // Create a lookup from name to mapped muscles
  const lookup = new Map<string, { primary: string[], secondary: string[] }>();
  
  for (const ex of externalData) {
    // Normalize name for matching
    const name = ex.name.toLowerCase();
    lookup.set(name, {
      primary: mapMuscles(ex.primaryMuscles, ex.name),
      secondary: mapMuscles(ex.secondaryMuscles, ex.name)
    });
  }
  
  // Explicit synonym mapping for our core seed lifts
  const coreLiftsSynonyms: Record<string, string> = {
    'barbell bench press': 'barbell bench press - medium grip',
    'barbell row': 'bent over barbell row',
    'overhead press': 'standing military press',
    'barbell bicep curl': 'barbell curl',
    'pull-up': 'pullups',
    'barbell squat': 'barbell full squat',
    'romanian deadlift': 'romanian deadlift'
  };
  
  console.log('Fetching existing exercises from Supabase...');
  const { data: exercises, error } = await supabase.from('exercises').select('*');
  
  if (error) {
    console.error('Error fetching exercises:', error);
    process.exit(1);
  }
  
  console.log(`Found ${exercises.length} local exercises. Updating...`);
  let updatedCount = 0;
  
  for (const ex of exercises) {
    const name = ex.name.toLowerCase();
    
    // 1. Try explicit synonym map
    let mapping = lookup.get(coreLiftsSynonyms[name] || name);
    
    // 2. Try substring match fallback (and log it)
    if (!mapping) {
      const fallbackKey = Array.from(lookup.keys()).find(k => k.includes(name) || name.includes(k));
      if (fallbackKey) {
        console.warn(`[MANUAL REVIEW] Falling back to substring match for '${name}' -> '${fallbackKey}'`);
        mapping = lookup.get(fallbackKey);
      }
    }
    
    if (mapping) {
      const { error: updateError } = await supabase
        .from('exercises')
        .update({
          primary_muscles: mapping.primary,
          secondary_muscles: mapping.secondary
        })
        .eq('id', ex.id);
        
      if (updateError) {
        console.error(`Failed to update ${ex.name}:`, updateError);
      } else {
        updatedCount++;
      }
    } else {
      console.log(`No match in free-exercise-db for local exercise: ${ex.name}`);
    }
  }
  
  console.log(`Successfully updated ${updatedCount} exercises with muscle mapping.`);
}

run().catch(console.error);
