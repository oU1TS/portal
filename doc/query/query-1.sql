-- Create profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  student_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create stars table
CREATE TABLE public.stars (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, resource_type, resource_id)
);

-- Create index for faster queries
CREATE INDEX idx_stars_resource ON public.stars(resource_type, resource_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stars ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
  
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Stars policies  
CREATE POLICY "Anyone can view star counts" ON public.stars
  FOR SELECT USING (true);
  
CREATE POLICY "Authenticated users can star" ON public.stars
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can unstar own stars" ON public.stars
  FOR DELETE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, student_id, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'student_id',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();