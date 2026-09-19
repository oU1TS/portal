-- ========================================================
-- oU1TS Centralized Database: Featured Projects & Ranking Schema
-- ========================================================
-- This table powers the Featured Projects Changing Gallery View
-- on the oU1TS Portal and can be called directly or via ou1ts-backend.
-- ========================================================

-- 1. Create the featured_projects table
CREATE TABLE IF NOT EXISTS public.featured_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Initiative',
  description TEXT,
  url TEXT NOT NULL,
  img TEXT,
  icon TEXT,
  alt TEXT,
  rank_score INTEGER NOT NULL DEFAULT 100 CHECK (rank_score >= 0),
  views_count INTEGER NOT NULL DEFAULT 0,
  stars_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_featured_projects_ranking ON public.featured_projects (rank_score DESC, stars_count DESC);
CREATE INDEX IF NOT EXISTS idx_featured_projects_active ON public.featured_projects (is_active);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.featured_projects ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies: Public read-only access, writes restricted to service_role / administrators
DROP POLICY IF EXISTS "Anyone can view active featured projects" ON public.featured_projects;
CREATE POLICY "Anyone can view active featured projects" ON public.featured_projects
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Service role can modify featured projects" ON public.featured_projects;
CREATE POLICY "Service role can modify featured projects" ON public.featured_projects
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 5. RPC Function: Query top ranked featured projects
CREATE OR REPLACE FUNCTION public.get_top_ranked_featured(limit_count INTEGER DEFAULT 3)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  title TEXT,
  category TEXT,
  description TEXT,
  url TEXT,
  img TEXT,
  icon TEXT,
  alt TEXT,
  rank_score INTEGER,
  stars_count INTEGER
) LANGUAGE sql STABLE AS $$
  SELECT 
    f.id,
    f.slug,
    f.title,
    f.category,
    f.description,
    f.url,
    f.img,
    f.icon,
    f.alt,
    f.rank_score,
    f.stars_count
  FROM public.featured_projects f
  WHERE f.is_active = true
  ORDER BY f.rank_score DESC, f.stars_count DESC, f.created_at DESC
  LIMIT limit_count;
$$;

-- 6. Seed Data: Top Initiatives for initial deployment
INSERT INTO public.featured_projects (slug, title, category, description, url, img, icon, alt, rank_score, stars_count)
VALUES
  (
    'uitssec',
    'UITS Cyber Security Wing',
    'Cybersecurity Hub',
    'Student research and practical security wing organizing CTFs, technical defense seminars, and security education.',
    'https://uitssec.github.io/',
    'https://res.cloudinary.com/b1tranger/image/upload/v1757773769/nobg_UITS_Cyber_Security_Wing_FB_logo_admu5c.png',
    NULL,
    'UITS Cyber Security Wing',
    150,
    48
  ),
  (
    'b1tacad',
    'b1t Academics',
    'Curriculum & Notes',
    'Structured lecture materials, curated course syllabi, lab guides, and verified question paper solutions across semesters.',
    'https://b1tacad.netlify.app/',
    'materials-icon/b1t-acad.webp',
    NULL,
    'b1t Academics',
    140,
    64
  ),
  (
    'bd-network',
    'Blood Donation Network',
    'Emergency Welfare',
    'Dedicated blood donor index connecting university students, verified alumni, and emergency requests across Dhaka.',
    'https://bd-ou1ts.netlify.app/',
    'tools-icon/logo-bd.png',
    NULL,
    'Blood Donation Network',
    135,
    52
  ),
  (
    'sfuits',
    'Students Forum of UITS',
    'Community Forum',
    'Active student discussion group fostering campus guidance, event coordination, and cross-department collaboration.',
    'https://www.facebook.com/groups/sfuits',
    'community-icon/sfuits-fb.webp',
    NULL,
    'Students Forum of UITS',
    120,
    39
  ),
  (
    'capstone-faq',
    'FAQ on Capstone Project',
    'Academic Guidance',
    'Comprehensive handbook and senior guidance resolving common capstone project queries, proposal tips, and supervisor interactions.',
    'https://foxxie911.github.io/FoxxieBlog/articles/2026/FEBRUARY/FAQonCapstoneProject.html',
    NULL,
    'fa-solid fa-graduation-cap',
    'FAQ on Capstone Project',
    115,
    33
  )
ON CONFLICT (slug) DO NOTHING;
