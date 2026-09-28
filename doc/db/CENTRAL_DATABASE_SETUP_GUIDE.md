# Central Database & Star Ranking Setup Guide for oU1TS Portal

This guide provides a comprehensive, step-by-step walkthrough for configuring and connecting the **oU1TS Portal** (`/portal`) to the centralized Supabase database established for the oU1TS ecosystem (`ou1ts.github.io` and `ou1ts-backend`).

---

## 1. System Architecture

```
                       [ Central Supabase Project ]
                                    │
               ┌────────────────────┴────────────────────┐
               ▼                                         ▼
      [ Identity & Users ]                      [ Sub-Project Tables ]
   auth.users & public.profiles                 public.stars, etc.
   (id, email, student_id, batch,              (user_id, resource_type,
    dept, blood_group, project_tags)            resource_id, created_at)
               │                                         │
        ┌──────┴──────────────┐                          │
        ▼                     ▼                          ▼
 [ Main Landing ]      [ oU1TS Portal ]       [ JSON Resources System ]
(ou1ts.github.io)      (SPA Project Hub)      (materials, tools, courses,
 Tag: 'root'           Tag: 'portal'           portfolios, capstones, etc.)
```

### Key Pillars:
1. **Unified Identity:** Users log in with the same account across both `ou1ts.github.io` and `portal`. Profiles reside in `public.profiles`.
2. **Project Tagging:** When a user logs into or registers on the portal, their profile's `project_tags` array automatically appends `'portal'`.
3. **Decoupled Stars System:** Star ratings are stored in `public.stars` referencing `public.profiles(id)` and the string `id` from the Portal's JSON catalogs in `json/*.json`.
4. **Live Ranking:** A database view (`resource_star_rankings`) calculates total stars, category-specific ranks, and global ranks across all items.

---

## 2. Step-by-Step Supabase Database Setup

### Step 2.1: Open the Supabase SQL Editor
1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your **oU1TS Central** project.
3. In the left-hand navigation sidebar, click on the **SQL Editor** icon (`>_`).
4. Click **New query** to open a blank SQL query window.

---

### Step 2.2: Execute the Unified Schema Script
Copy and paste the entire script from [`doc/query/query-4-central-db-portal-stars.sql`](../query/query-4-central-db-portal-stars.sql) into the query window, then click **Run** (or press `Ctrl+Enter`).

The query executes four critical sections:

#### Section A — Central Profiles Table & Constraints
```sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  student_id TEXT,
  department TEXT,
  batch TEXT,
  blood_group TEXT,
  social_facebook TEXT,
  social_instagram TEXT,
  social_telegram TEXT,
  social_discord TEXT,
  project_tags TEXT[] DEFAULT ARRAY['root']::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT check_student_id_numeric_or_oauth 
    CHECK (student_id ~ '^[0-9]+$' OR student_id = 'OAUTH_USER' OR student_id IS NULL),
  
  CONSTRAINT check_blood_group_valid 
    CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') OR blood_group IS NULL)
);

-- Partial index allowing multiple Google/OAuth accounts while enforcing unique numeric student IDs
CREATE UNIQUE INDEX IF NOT EXISTS profiles_student_id_unique
  ON public.profiles (student_id)
  WHERE student_id IS NOT NULL AND student_id <> 'OAUTH_USER';
```

#### Section B — Row Level Security (RLS) on Profiles
```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (true);
```

#### Section C — Auto-Profile Trigger & Sub-Project Tagging RPC
```sql
-- Trigger to generate profile on signup and auto-tag 'portal'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    student_id, 
    email, 
    full_name, 
    department,
    blood_group,
    project_tags
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'student_id', 'OAUTH_USER'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'department', NULL),
    COALESCE(NEW.raw_user_meta_data->>'blood_group', NULL),
    ARRAY['root', 'portal']::TEXT[]
  )
  ON CONFLICT (id) DO UPDATE SET
    project_tags = array_append(public.profiles.project_tags, 'portal')
    WHERE NOT ('portal' = ANY(public.profiles.project_tags));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC callable by portal frontend: supabase.rpc('add_project_tag', { tag: 'portal' })
CREATE OR REPLACE FUNCTION public.add_project_tag(tag TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET project_tags = array_append(project_tags, tag),
      updated_at = NOW()
  WHERE id = auth.uid()
    AND NOT (tag = ANY(project_tags));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Section D — The Portal Stars Table
```sql
CREATE TABLE IF NOT EXISTS public.stars (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_resource_star UNIQUE (user_id, resource_type, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_stars_resource ON public.stars(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_stars_user ON public.stars(user_id);

ALTER TABLE public.stars ENABLE ROW LEVEL SECURITY;

-- Anyone can see star counts; authenticated users can star and unstar
CREATE POLICY "Anyone can view star counts" ON public.stars
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can star" ON public.stars
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unstar own stars" ON public.stars
  FOR DELETE USING (auth.uid() = user_id);
```

#### Section E — Real-time Star Ranking View & Analytics
```sql
CREATE OR REPLACE VIEW public.resource_star_rankings AS
SELECT 
  s.resource_type,
  s.resource_id,
  COUNT(*)::INTEGER AS total_stars,
  DENSE_RANK() OVER (PARTITION BY s.resource_type ORDER BY COUNT(*) DESC) AS category_rank,
  DENSE_RANK() OVER (ORDER BY COUNT(*) DESC) AS global_rank
FROM public.stars s
GROUP BY s.resource_type, s.resource_id;
```

---

## 3. Configuring Supabase Authentication & Redirects

To allow students to authenticate from both domains and local environments:

1. In Supabase Dashboard, navigate to **Authentication** → **URL Configuration**.
2. Set **Site URL** to:
   ```text
   https://ou1ts.github.io/
   ```
3. In **Redirect URLs**, add the following entries:
   ```text
   https://ou1ts.github.io/**
   https://ou1ts.github.io/portal/**
   http://localhost:3000/**
   http://127.0.0.1:5500/**
   ```
4. If using **Google OAuth**:
   - Go to **Authentication** → **Providers** → **Google**.
   - Enable Google provider.
   - Enter your **Google Client ID** and **Client Secret** (from Google Cloud Console).
   - In Google Cloud Console, ensure the **Authorized redirect URI** matches your Supabase Callback URL:
     `https://<YOUR-PROJECT-ID>.supabase.co/auth/v1/callback`

---

## 4. Connecting the Portal Application

### 4.1 Local Development Configuration
1. In the portal root, create a file named `env-config.js` (this file is ignored by Git in `.gitignore`):
   ```javascript
   window.__ENV = {
       SUPABASE_URL: 'https://<YOUR_SUPABASE_PROJECT_ID>.supabase.co',
       SUPABASE_ANON_KEY: '<YOUR_SUPABASE_ANON_KEY>'
   };
   ```
2. A template file [`env-config.example.js`](../../env-config.example.js) is provided in the repository.

### 4.2 Production Deployment (GitHub Actions)
In your repository settings on GitHub:
1. Navigate to **Settings** → **Secrets and variables** → **Actions**.
2. Add the repository secrets:
   - `SUPABASE_URL`: Your Supabase Project URL
   - `SUPABASE_ANON_KEY`: Your Supabase Public `anon` Key
3. The automated GitHub Actions deployment workflow injects these secrets into `env-config.js` upon building and publishing.

---

## 5. How Star Rankings Account for JSON Resources

The portal loads resources dynamically from `json/*.json`:

| JSON File | Category / `resource_type` | Sample `resource_id` | UI Presentation |
| :--- | :--- | :--- | :--- |
| `materials.json` | `materials` | `materials-b1tacad` | Star button, descending sorting |
| `tools.json` | `tools` | `tools-b1tsched` | Star button, descending sorting |
| `guidance.json` | `guidance` | `guidance-faq-capstone` | Star button, descending sorting |
| `community.json` | `community` | `community-telegram` | Star button, descending sorting |
| `courses.json` | `courses` | `courses-dsa1-robiul` | Per-dropdown star sorting |
| `portfolios.json` | `portfolios` | `portfolio-chatokjnr` | Star button, profile showcases |
| `official.json` | `official` | `official-portal` | Star button, link cards |
| `inspirations.json` | `inspirations` | `inspirations-devto` | Dropdown cards with stars |
| `capstones.json` | `capstones` | `capstone-smart-campus` | Spotlight & batch accordions |
| `mentors.json` | `mentors` | `mentor-akib-reza` | Senior cards with stars rank |
| `talent.json` | `talent` | `talent-fahim-rahman` | Candidate cards with skill tags |

### Mechanics:
1. **Initial Load:** When a page view opens, `Stars.init(pageType)` queries `public.stars` for all stars matching `resource_type`.
2. **User Stars:** If a student is logged in, their starred resources are fetched and highlighted with gold star styling (`.star-btn.starred`).
3. **Dynamic Sorting:** `Stars.sortResourcesByStars()` automatically re-orders the DOM nodes descending by star count, placing top-rated community tools and guides at the top.
4. **Profile Starred Dashboard:** Visiting the `#profile` view displays all resources starred by the student, complete with quick navigation and unstar capabilities.

---

## 6. Optional Backend Integration (`ou1ts-backend`)

If you want server-side caching, webhooks, or API endpoints:
- In `D:\GitHub\[oU1TS]\ou1ts-backend`, routes under `src/routes/projects.js` or `src/routes/profiles.js` can connect to the same Supabase database using `SUPABASE_SERVICE_ROLE_KEY`.
- The backend can serve endpoints like:
  - `GET /api/stars/rankings`: Returns top starred items aggregated by `public.resource_star_rankings`.
  - `POST /api/webhooks/user-signup`: Sends a welcome email or notifies Discord when a new student joins.

---

## 7. Verification Checklist

To verify your central database setup is operational:

- [ ] In Supabase SQL Editor, run:
  ```sql
  SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
  ```
  Ensure `profiles` and `stars` are listed.
- [ ] Verify Row Level Security is active:
  ```sql
  SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
  ```
- [ ] In the Portal web app, register or log in with an email or Google account.
- [ ] Check the `profiles` table in Supabase Dashboard → **Table Editor** → `profiles`. Your user record should appear with `project_tags` containing `['root', 'portal']`.
- [ ] Click a star on any resource. Check `stars` in Supabase to see the new record inserted.
- [ ] Refresh the page: the star count and starred state should persist.

---

## 8. Portal CMS, Central Resources Database & Admin Role Delegation (Query 5)

To enable live resource approvals, Google Form feedback management, and project-level admin delegation without editing JSON files, run the Query 5 migration script.

### 8.1 Execute Query 5 in Supabase
1. Open [`doc/query/query-5-portal-cms-resources-schema.sql`](../query/query-5-portal-cms-resources-schema.sql).
2. Copy the entire file and paste it into the **Supabase SQL Editor**.
3. Click **Run**.
   - This creates:
     - `public.profiles.is_portal_admin`: Admin flag isolated to the portal project.
     - `public.portal_resources`: Master catalog for approved community resources.
     - `public.portal_submissions`: Community submissions and Google Form `FEEDBACK` records.
     - RLS security policies allowing public reading of approved resources and admin-only management.
     - RPC functions `get_portal_users()`, `set_portal_admin()`, and `approve_resource_submission()`.
     - Seeds all 63 items across 10 categories from `json/*.json`.

### 8.2 Designate the Default Portal Admin
Directly in Supabase, execute:
```sql
UPDATE public.profiles
SET is_portal_admin = true
WHERE email = 'your.email@uits.edu.bd';
```
Or open **Table Editor** → `profiles`, find your user row, and set `is_portal_admin` to `true`.

### 8.3 Using the Admin CMS Portal
1. Log into the portal with your admin account.
2. An **Admin CMS** button will appear in the top navigation bar and inside your **Profile Dashboard**.
3. Click to open the **oU1TS Portal CMS** modal:
   - **Submissions & Approvals:** Review new community links, click **Approve** to publish them instantly to the live catalog, or click **Sync Google Form** to import entries directly from the community Google Sheet (`1oQ5Mkavjm62UGZwNjM-52yvKppWZHfX-Qpq6jtEVIOY`).
   - **Content Manager:** Browse, edit, reorder, or add resources to any category (`materials`, `tools`, `guidance`, `community`, `official`, `portfolios`, `courses`, `capstones`, `mentors`, `talent`).
   - **Feedback Inbox:** Triage student feedback and bug reports with resolution tags.
   - **Admin User Selector:** View all students who have logged into this portal (`'portal' = ANY(project_tags)`) and toggle admin privileges on/off with one click.

