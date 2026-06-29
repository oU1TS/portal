-- Drop the old unique constraint
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_student_id_key;

-- Recreate uniqueness only for real student IDs
CREATE UNIQUE INDEX IF NOT EXISTS profiles_student_id_unique
  ON public.profiles (student_id)
  WHERE student_id IS NOT NULL AND student_id <> 'OAUTH_USER';