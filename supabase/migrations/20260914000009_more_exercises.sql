-- 20260914000009_more_exercises.sql

-- First, ensure exercise names are unique to support idempotency and lookups
ALTER TABLE public.exercises DROP CONSTRAINT IF EXISTS exercises_name_key;
ALTER TABLE public.exercises ADD CONSTRAINT exercises_name_key UNIQUE (name);

INSERT INTO public.exercises (name, equipment, muscle_group, primary_muscles, secondary_muscles)
VALUES
  ('Ab Roller', 'barbell', 'abs', ARRAY['abs']::text[], ARRAY['front-deltoids']::text[]),
  ('Barbell Bench Press - Medium Grip', 'barbell', 'chest', ARRAY['chest']::text[], ARRAY['front-deltoids','triceps']::text[]),
  ('Barbell Curl', 'barbell', 'biceps', ARRAY['biceps']::text[], ARRAY['forearm']::text[]),
  ('Barbell Full Squat', 'barbell', 'quadriceps', ARRAY['quadriceps']::text[], ARRAY['calves','gluteal','hamstrings','lower-back']::text[]),
  ('Bench Dips', 'body only', 'triceps', ARRAY['triceps']::text[], ARRAY['chest','front-deltoids']::text[]),
  ('Bent Over Barbell Row', 'barbell', 'upper-back', ARRAY['upper-back']::text[], ARRAY['biceps','upper-back','back-deltoids']::text[]),
  ('Cable Crossover', 'cable', 'chest', ARRAY['chest']::text[], ARRAY['front-deltoids']::text[]),
  ('Cable Crunch', 'cable', 'abs', ARRAY['abs']::text[], ARRAY[]::text[]),
  ('Calf Press On The Leg Press Machine', 'machine', 'calves', ARRAY['calves']::text[], ARRAY[]::text[]),
  ('Concentration Curls', 'dumbbell', 'biceps', ARRAY['biceps']::text[], ARRAY['forearm']::text[]),
  ('Crunches', 'body only', 'abs', ARRAY['abs']::text[], ARRAY[]::text[]),
  ('Decline Barbell Bench Press', 'barbell', 'chest', ARRAY['chest']::text[], ARRAY['front-deltoids','triceps']::text[]),
  ('Dumbbell Alternate Bicep Curl', 'dumbbell', 'biceps', ARRAY['biceps']::text[], ARRAY['forearm']::text[]),
  ('Dumbbell Bench Press', 'dumbbell', 'chest', ARRAY['chest']::text[], ARRAY['front-deltoids','triceps']::text[]),
  ('Dumbbell Flyes', 'dumbbell', 'chest', ARRAY['chest']::text[], ARRAY[]::text[]),
  ('Face Pull', 'cable', 'back-deltoids', ARRAY['back-deltoids']::text[], ARRAY['upper-back']::text[]),
  ('Farmer''s Walk', 'barbell', 'forearm', ARRAY['forearm']::text[], ARRAY['abs','gluteal','hamstrings','lower-back','quadriceps','trapezius']::text[]),
  ('Front Barbell Squat', 'barbell', 'quadriceps', ARRAY['quadriceps']::text[], ARRAY['calves','gluteal','hamstrings']::text[]),
  ('Front Dumbbell Raise', 'dumbbell', 'front-deltoids', ARRAY['front-deltoids']::text[], ARRAY[]::text[]),
  ('Hack Squat', 'machine', 'quadriceps', ARRAY['quadriceps']::text[], ARRAY['calves','gluteal','hamstrings']::text[]),
  ('Hammer Curls', 'dumbbell', 'biceps', ARRAY['biceps']::text[], ARRAY[]::text[]),
  ('Hanging Leg Raise', 'body only', 'abs', ARRAY['abs']::text[], ARRAY[]::text[]),
  ('Incline Dumbbell Press', 'dumbbell', 'chest', ARRAY['chest']::text[], ARRAY['front-deltoids','triceps']::text[]),
  ('Leg Extensions', 'machine', 'quadriceps', ARRAY['quadriceps']::text[], ARRAY[]::text[]),
  ('Leg Press', 'machine', 'quadriceps', ARRAY['quadriceps']::text[], ARRAY['calves','gluteal','hamstrings']::text[]),
  ('Lying Leg Curls', 'machine', 'hamstrings', ARRAY['hamstrings']::text[], ARRAY[]::text[]),
  ('Lying Triceps Press', 'e-z curl bar', 'triceps', ARRAY['triceps']::text[], ARRAY[]::text[]),
  ('Plank', 'body only', 'abs', ARRAY['abs']::text[], ARRAY[]::text[]),
  ('Preacher Curl', 'barbell', 'biceps', ARRAY['biceps']::text[], ARRAY[]::text[]),
  ('Pullups', 'body only', 'upper-back', ARRAY['upper-back']::text[], ARRAY['biceps','upper-back']::text[]),
  ('Pushups', 'body only', 'chest', ARRAY['chest']::text[], ARRAY['front-deltoids','triceps']::text[]),
  ('Rack Pulls', 'barbell', 'lower-back', ARRAY['lower-back']::text[], ARRAY['forearm','gluteal','hamstrings','trapezius']::text[]),
  ('Reverse Machine Flyes', 'machine', 'front-deltoids', ARRAY['front-deltoids']::text[], ARRAY[]::text[]),
  ('Romanian Deadlift', 'barbell', 'hamstrings', ARRAY['hamstrings']::text[], ARRAY['calves','gluteal','lower-back']::text[]),
  ('Russian Twist', 'body only', 'abs', ARRAY['abs']::text[], ARRAY['lower-back']::text[]),
  ('Seated Cable Rows', 'cable', 'upper-back', ARRAY['upper-back']::text[], ARRAY['biceps','upper-back','back-deltoids']::text[]),
  ('Seated Calf Raise', 'machine', 'calves', ARRAY['calves']::text[], ARRAY[]::text[]),
  ('Seated Dumbbell Press', 'dumbbell', 'front-deltoids', ARRAY['front-deltoids']::text[], ARRAY['triceps']::text[]),
  ('Seated Leg Curl', 'machine', 'hamstrings', ARRAY['hamstrings']::text[], ARRAY[]::text[]),
  ('Side Lateral Raise', 'dumbbell', 'front-deltoids', ARRAY['front-deltoids']::text[], ARRAY[]::text[]),
  ('Standing Calf Raises', 'machine', 'calves', ARRAY['calves']::text[], ARRAY[]::text[]),
  ('Standing Military Press', 'barbell', 'front-deltoids', ARRAY['front-deltoids']::text[], ARRAY['triceps']::text[]),
  ('Tricep Dumbbell Kickback', 'dumbbell', 'triceps', ARRAY['triceps']::text[], ARRAY[]::text[]),
  ('Triceps Pushdown', 'cable', 'triceps', ARRAY['triceps']::text[], ARRAY[]::text[]),
  ('Upright Barbell Row', 'barbell', 'back-deltoids', ARRAY['back-deltoids']::text[], ARRAY['trapezius']::text[])
ON CONFLICT (name) DO UPDATE SET equipment = EXCLUDED.equipment, muscle_group = EXCLUDED.muscle_group, primary_muscles = EXCLUDED.primary_muscles, secondary_muscles = EXCLUDED.secondary_muscles;