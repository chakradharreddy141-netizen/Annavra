-- 20260914000009_more_exercises.sql

-- First, ensure exercise names are unique to support idempotency and lookups
ALTER TABLE public.exercises DROP CONSTRAINT IF EXISTS exercises_name_key;
ALTER TABLE public.exercises ADD CONSTRAINT exercises_name_key UNIQUE (name);

INSERT INTO public.exercises (name, default_equipment, primary_muscles, secondary_muscles)
VALUES
  ('Ab Roller', 'barbell', '["abs"]'::jsonb, '["front-deltoids"]'::jsonb),
  ('Barbell Bench Press - Medium Grip', 'barbell', '["chest"]'::jsonb, '["front-deltoids","triceps"]'::jsonb),
  ('Barbell Curl', 'barbell', '["biceps"]'::jsonb, '["forearm"]'::jsonb),
  ('Barbell Full Squat', 'barbell', '["quadriceps"]'::jsonb, '["calves","gluteal","hamstrings","lower-back"]'::jsonb),
  ('Bench Dips', 'body only', '["triceps"]'::jsonb, '["chest","front-deltoids"]'::jsonb),
  ('Bent Over Barbell Row', 'barbell', '["upper-back"]'::jsonb, '["biceps","upper-back","back-deltoids"]'::jsonb),
  ('Cable Crossover', 'cable', '["chest"]'::jsonb, '["front-deltoids"]'::jsonb),
  ('Cable Crunch', 'cable', '["abs"]'::jsonb, '[]'::jsonb),
  ('Calf Press On The Leg Press Machine', 'machine', '["calves"]'::jsonb, '[]'::jsonb),
  ('Concentration Curls', 'dumbbell', '["biceps"]'::jsonb, '["forearm"]'::jsonb),
  ('Crunches', 'body only', '["abs"]'::jsonb, '[]'::jsonb),
  ('Decline Barbell Bench Press', 'barbell', '["chest"]'::jsonb, '["front-deltoids","triceps"]'::jsonb),
  ('Dumbbell Alternate Bicep Curl', 'dumbbell', '["biceps"]'::jsonb, '["forearm"]'::jsonb),
  ('Dumbbell Bench Press', 'dumbbell', '["chest"]'::jsonb, '["front-deltoids","triceps"]'::jsonb),
  ('Dumbbell Flyes', 'dumbbell', '["chest"]'::jsonb, '[]'::jsonb),
  ('Face Pull', 'cable', '["back-deltoids"]'::jsonb, '["upper-back"]'::jsonb),
  ('Farmer''s Walk', 'barbell', '["forearm"]'::jsonb, '["abs","gluteal","hamstrings","lower-back","quadriceps","trapezius"]'::jsonb),
  ('Front Barbell Squat', 'barbell', '["quadriceps"]'::jsonb, '["calves","gluteal","hamstrings"]'::jsonb),
  ('Front Dumbbell Raise', 'dumbbell', '["front-deltoids"]'::jsonb, '[]'::jsonb),
  ('Hack Squat', 'machine', '["quadriceps"]'::jsonb, '["calves","gluteal","hamstrings"]'::jsonb),
  ('Hammer Curls', 'dumbbell', '["biceps"]'::jsonb, '[]'::jsonb),
  ('Hanging Leg Raise', 'body only', '["abs"]'::jsonb, '[]'::jsonb),
  ('Incline Dumbbell Press', 'dumbbell', '["chest"]'::jsonb, '["front-deltoids","triceps"]'::jsonb),
  ('Leg Extensions', 'machine', '["quadriceps"]'::jsonb, '[]'::jsonb),
  ('Leg Press', 'machine', '["quadriceps"]'::jsonb, '["calves","gluteal","hamstrings"]'::jsonb),
  ('Lying Leg Curls', 'machine', '["hamstrings"]'::jsonb, '[]'::jsonb),
  ('Lying Triceps Press', 'e-z curl bar', '["triceps"]'::jsonb, '[]'::jsonb),
  ('Plank', 'body only', '["abs"]'::jsonb, '[]'::jsonb),
  ('Preacher Curl', 'barbell', '["biceps"]'::jsonb, '[]'::jsonb),
  ('Pullups', 'body only', '["upper-back"]'::jsonb, '["biceps","upper-back"]'::jsonb),
  ('Pushups', 'body only', '["chest"]'::jsonb, '["front-deltoids","triceps"]'::jsonb),
  ('Rack Pulls', 'barbell', '["lower-back"]'::jsonb, '["forearm","gluteal","hamstrings","trapezius"]'::jsonb),
  ('Reverse Machine Flyes', 'machine', '["front-deltoids"]'::jsonb, '[]'::jsonb),
  ('Romanian Deadlift', 'barbell', '["hamstrings"]'::jsonb, '["calves","gluteal","lower-back"]'::jsonb),
  ('Russian Twist', 'body only', '["abs"]'::jsonb, '["lower-back"]'::jsonb),
  ('Seated Cable Rows', 'cable', '["upper-back"]'::jsonb, '["biceps","upper-back","back-deltoids"]'::jsonb),
  ('Seated Calf Raise', 'machine', '["calves"]'::jsonb, '[]'::jsonb),
  ('Seated Dumbbell Press', 'dumbbell', '["front-deltoids"]'::jsonb, '["triceps"]'::jsonb),
  ('Seated Leg Curl', 'machine', '["hamstrings"]'::jsonb, '[]'::jsonb),
  ('Side Lateral Raise', 'dumbbell', '["front-deltoids"]'::jsonb, '[]'::jsonb),
  ('Standing Calf Raises', 'machine', '["calves"]'::jsonb, '[]'::jsonb),
  ('Standing Military Press', 'barbell', '["front-deltoids"]'::jsonb, '["triceps"]'::jsonb),
  ('Tricep Dumbbell Kickback', 'dumbbell', '["triceps"]'::jsonb, '[]'::jsonb),
  ('Triceps Pushdown', 'cable', '["triceps"]'::jsonb, '[]'::jsonb),
  ('Upright Barbell Row', 'barbell', '["back-deltoids"]'::jsonb, '["trapezius"]'::jsonb)
ON CONFLICT (name) DO UPDATE SET primary_muscles = EXCLUDED.primary_muscles, secondary_muscles = EXCLUDED.secondary_muscles;