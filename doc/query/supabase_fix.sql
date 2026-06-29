-- Fix for Google OAuth Login Issue
-- This script updates the database to properly handle OAuth users

-- Step 1: Make student_id nullable for OAuth users
ALTER TABLE public.profiles ALTER COLUMN student_id DROP NOT NULL;

-- Step 2: Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 3: Create updated trigger function that handles OAuth users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, student_id, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'student_id', 'OAUTH_USER'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Add INSERT policy for profiles (required for trigger to work)
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
CREATE POLICY "Service role can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- Step 6: Clean up any orphaned auth users without profiles (optional)
-- This creates profiles for existing OAuth users who signed in before the fix
INSERT INTO public.profiles (id, student_id, email)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'student_id', 'OAUTH_USER'),
  au.email
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
