-- Fix for Duplicate OAUTH_USER Constraint Issue
-- Run this when you get: "duplicate key value violates unique constraint"
-- This replaces the old UNIQUE constraint with a partial unique index
-- that allows multiple OAUTH_USER entries while keeping real student IDs unique

-- Step 1: Drop the old unique constraint
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_student_id_key;

-- Step 2: Create partial unique index (allows multiple OAUTH_USER, unique real student IDs)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_student_id_unique
  ON public.profiles (student_id)
  WHERE student_id IS NOT NULL AND student_id <> 'OAUTH_USER';
