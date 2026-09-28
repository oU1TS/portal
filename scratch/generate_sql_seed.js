const fs = require('fs');
const path = require('path');

const jsonDir = path.join(__dirname, '..', 'json');

function escapeSql(str) {
    if (str === null || str === undefined) return "''";
    return "'" + String(str).replace(/'/g, "''") + "'";
}

function escapeArray(arr) {
    if (!arr || !Array.isArray(arr) || arr.length === 0) return 'ARRAY[]::TEXT[]';
    const escapedItems = arr.map(item => "'" + String(item).replace(/'/g, "''") + "'");
    return `ARRAY[${escapedItems.join(', ')}]::TEXT[]`;
}

function escapeJson(obj) {
    if (!obj) return "'{}'::JSONB";
    return "'" + JSON.stringify(obj).replace(/'/g, "''") + "'::JSONB";
}

let allRows = [];

// 1. Standard categories
const standardFiles = [
    { file: 'materials.json', category: 'materials' },
    { file: 'tools.json', category: 'tools' },
    { file: 'guidance.json', category: 'guidance' },
    { file: 'community.json', category: 'community' },
    { file: 'official.json', category: 'official' },
    { file: 'portfolios.json', category: 'portfolios' },
];

standardFiles.forEach(({ file, category }) => {
    const raw = fs.readFileSync(path.join(jsonDir, file), 'utf8');
    const items = JSON.parse(raw);
    items.forEach((item, idx) => {
        allRows.push({
            id: item.id || `${category}-${idx}`,
            category: category,
            title: item.title,
            description: item.description || '',
            url: item.visitUrl || item.url || '',
            copy_url: item.copyUrl || item.visitUrl || item.url || '',
            icon: item.icon || null,
            links: item.links || [],
            tags: item.tags || [],
            extra_data: {},
            sort_order: idx + 1
        });
    });
});

// 2. Courses
const coursesRaw = fs.readFileSync(path.join(jsonDir, 'courses.json'), 'utf8');
const coursesSections = JSON.parse(coursesRaw);
let courseIdx = 0;
coursesSections.forEach(section => {
    (section.items || []).forEach(item => {
        courseIdx++;
        let title = section.category;
        let url = '';
        let desc = '';
        if (item.rawHtml) {
            const aMatch = item.rawHtml.match(/<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/i);
            if (aMatch) {
                url = aMatch[1];
                title = aMatch[2].replace(/<[^>]*>/g, '').trim();
            }
            const pMatch = item.rawHtml.match(/<p[^>]*>(.*?)<\/p>/i);
            if (pMatch) {
                desc = pMatch[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            }
        }
        allRows.push({
            id: item.id || `courses-${courseIdx}`,
            category: 'courses',
            title: title || section.category,
            description: desc,
            url: url,
            copy_url: url,
            icon: { type: 'icon', class: item.iconClass || 'fa-brands fa-github' },
            links: [],
            tags: [section.category],
            extra_data: {
                course_category: section.category,
                course_icon: section.icon,
                rawHtml: item.rawHtml
            },
            sort_order: courseIdx
        });
    });
});

// 3. Capstones
const capstonesRaw = fs.readFileSync(path.join(jsonDir, 'capstones.json'), 'utf8');
const capstonesItems = JSON.parse(capstonesRaw);
capstonesItems.forEach((item, idx) => {
    allRows.push({
        id: item.id || `capstones-${idx}`,
        category: 'capstones',
        title: item.title,
        description: item.description || '',
        url: item.visitUrl || '',
        copy_url: item.visitUrl || '',
        icon: item.image ? { type: 'image', src: item.image } : null,
        links: [{ label: 'Demo', url: item.visitUrl || '' }],
        tags: item.tags || [],
        extra_data: {
            batch: item.batch,
            semester: item.semester,
            team: item.team,
            image: item.image,
            repoUrl: item.visitUrl
        },
        sort_order: idx + 1
    });
});

// 4. Mentors
const mentorsRaw = fs.readFileSync(path.join(jsonDir, 'mentors.json'), 'utf8');
const mentorsItems = JSON.parse(mentorsRaw);
mentorsItems.forEach((item, idx) => {
    allRows.push({
        id: item.id || `mentors-${idx}`,
        category: 'mentors',
        title: item.name,
        description: `${item.title || ''} at ${item.company || ''} (${item.batch || ''}). ${item.experience || ''}`.trim(),
        url: item.socials?.linkedin || item.socials?.github || `mailto:${item.email || ''}`,
        copy_url: item.socials?.linkedin || '',
        icon: { type: 'text', text: item.name ? item.name.charAt(0) : 'M' },
        links: [],
        tags: item.skills || [],
        extra_data: {
            name: item.name,
            title: item.title,
            role: item.role,
            company: item.company,
            batch: item.batch,
            experience: item.experience,
            stars: item.stars,
            email: item.email,
            socials: item.socials,
            skills: item.skills
        },
        sort_order: idx + 1
    });
});

// 5. Talent
const talentRaw = fs.readFileSync(path.join(jsonDir, 'talent.json'), 'utf8');
const talentItems = JSON.parse(talentRaw);
talentItems.forEach((item, idx) => {
    allRows.push({
        id: item.id || `talent-${idx}`,
        category: 'talent',
        title: item.name,
        description: item.bio || `${item.role || ''} - ${item.sector || ''}`.trim(),
        url: item.socials?.linkedin || item.socials?.github || `mailto:${item.socials?.email || ''}`,
        copy_url: item.socials?.linkedin || '',
        icon: { type: 'text', text: item.name ? item.name.charAt(0) : 'T' },
        links: [],
        tags: item.skills || [],
        extra_data: {
            name: item.name,
            role: item.role,
            sector: item.sector,
            bio: item.bio,
            skills: item.skills,
            socials: item.socials
        },
        sort_order: idx + 1
    });
});

let sql = `-- ============================================================================
-- QUERY 5: PORTAL CMS, CENTRAL RESOURCES REPOSITORY & ADMIN DELEGATION
-- Database: Central Supabase Instance
-- Purpose: 
--   1. Add portal-specific administrator flag on public.profiles (is_portal_admin).
--   2. Create public.portal_resources table to store & auto-arrange all verified resources.
--   3. Create public.portal_submissions table for student submissions & FEEDBACK.
--   4. Implement Row Level Security (RLS) policies for public reading & admin management.
--   5. Implement RPC functions for Admin User Selector modal & submission approval.
--   6. Migrate & seed all 63 catalog records across 10 categories from json/*.json.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Add is_portal_admin to public.profiles
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_portal_admin BOOLEAN NOT NULL DEFAULT false;

-- Add index on is_portal_admin
CREATE INDEX IF NOT EXISTS idx_profiles_is_portal_admin ON public.profiles(is_portal_admin);

-- Comment
COMMENT ON COLUMN public.profiles.is_portal_admin IS 'Designates administrator privileges strictly within the oU1TS Portal project';

-- ----------------------------------------------------------------------------
-- STEP 2: Create public.portal_resources Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.portal_resources (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    url TEXT DEFAULT '',
    copy_url TEXT DEFAULT '',
    icon JSONB DEFAULT '{}'::JSONB,
    links JSONB DEFAULT '[]'::JSONB,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    extra_data JSONB DEFAULT '{}'::JSONB,
    status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('approved', 'pending', 'rejected', 'archived')),
    sort_order INTEGER NOT NULL DEFAULT 0,
    submitted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portal_resources_cat_status ON public.portal_resources(category, status);
CREATE INDEX IF NOT EXISTS idx_portal_resources_sort ON public.portal_resources(sort_order);
CREATE INDEX IF NOT EXISTS idx_portal_resources_submitted ON public.portal_resources(submitted_by);

-- ----------------------------------------------------------------------------
-- STEP 3: Create public.portal_submissions Table (Resources + FEEDBACK)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.portal_submissions (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    submission_type TEXT NOT NULL DEFAULT 'resource' CHECK (submission_type IN ('resource', 'feedback')),
    category TEXT DEFAULT 'general',
    title TEXT,
    description TEXT,
    url TEXT,
    submitter_name TEXT,
    submitter_email TEXT,
    submitter_department TEXT,
    submitter_batch TEXT,
    feedback_type TEXT DEFAULT 'general',
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    details JSONB DEFAULT '{}'::JSONB,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'reviewed', 'resolved')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portal_submissions_status ON public.portal_submissions(status);
CREATE INDEX IF NOT EXISTS idx_portal_submissions_type ON public.portal_submissions(submission_type);

-- ----------------------------------------------------------------------------
-- STEP 4: Helper & Security Functions
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_portal_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT COALESCE(
        (SELECT is_portal_admin FROM public.profiles WHERE id = auth.uid()),
        false
    );
$$;

-- Enable Row Level Security
ALTER TABLE public.portal_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_submissions ENABLE ROW LEVEL SECURITY;

-- Clean existing policies
DROP POLICY IF EXISTS "Public read approved resources" ON public.portal_resources;
DROP POLICY IF EXISTS "Admin insert resources" ON public.portal_resources;
DROP POLICY IF EXISTS "Admin update resources" ON public.portal_resources;
DROP POLICY IF EXISTS "Admin delete resources" ON public.portal_resources;

DROP POLICY IF EXISTS "Public insert submissions" ON public.portal_submissions;
DROP POLICY IF EXISTS "Admin select submissions" ON public.portal_submissions;
DROP POLICY IF EXISTS "Admin update submissions" ON public.portal_submissions;
DROP POLICY IF EXISTS "Admin delete submissions" ON public.portal_submissions;

-- Policies for portal_resources
CREATE POLICY "Public read approved resources"
    ON public.portal_resources
    FOR SELECT
    USING (status = 'approved' OR public.is_portal_admin());

CREATE POLICY "Admin insert resources"
    ON public.portal_resources
    FOR INSERT
    WITH CHECK (public.is_portal_admin());

CREATE POLICY "Admin update resources"
    ON public.portal_resources
    FOR UPDATE
    USING (public.is_portal_admin())
    WITH CHECK (public.is_portal_admin());

CREATE POLICY "Admin delete resources"
    ON public.portal_resources
    FOR DELETE
    USING (public.is_portal_admin());

-- Policies for portal_submissions
CREATE POLICY "Public insert submissions"
    ON public.portal_submissions
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admin select submissions"
    ON public.portal_submissions
    FOR SELECT
    USING (public.is_portal_admin());

CREATE POLICY "Admin update submissions"
    ON public.portal_submissions
    FOR UPDATE
    USING (public.is_portal_admin())
    WITH CHECK (public.is_portal_admin());

CREATE POLICY "Admin delete submissions"
    ON public.portal_submissions
    FOR DELETE
    USING (public.is_portal_admin());

-- ----------------------------------------------------------------------------
-- STEP 5: RPC Functions for Admin Management & Approvals
-- ----------------------------------------------------------------------------

-- Function: Get all users who have logged into the portal project
CREATE OR REPLACE FUNCTION public.get_portal_users()
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    email TEXT,
    student_id TEXT,
    department TEXT,
    batch TEXT,
    avatar_url TEXT,
    project_tags TEXT[],
    is_portal_admin BOOLEAN,
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT public.is_portal_admin() THEN
        RAISE EXCEPTION 'Access denied. Caller is not an authorized portal administrator.';
    END IF;

    RETURN QUERY
    SELECT 
        p.id,
        p.full_name,
        p.email,
        p.student_id,
        p.department,
        p.batch,
        p.avatar_url,
        p.project_tags,
        p.is_portal_admin,
        p.last_seen_at,
        p.created_at
    FROM public.profiles p
    WHERE 'portal' = ANY(p.project_tags)
    ORDER BY p.is_portal_admin DESC, p.last_seen_at DESC NULLS LAST;
END;
$$;

-- Function: Delegate or revoke portal admin role (admin-only)
CREATE OR REPLACE FUNCTION public.set_portal_admin(
    target_user_id UUID,
    grant_admin BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_target_exists BOOLEAN;
BEGIN
    IF NOT public.is_portal_admin() THEN
        RAISE EXCEPTION 'Access denied. Only an existing portal administrator can update admin roles.';
    END IF;

    SELECT ('portal' = ANY(project_tags)) INTO v_target_exists
    FROM public.profiles
    WHERE id = target_user_id;

    IF v_target_exists IS NULL THEN
        RAISE EXCEPTION 'Target user does not exist in public.profiles.';
    END IF;

    UPDATE public.profiles
    SET is_portal_admin = grant_admin,
        updated_at = NOW()
    WHERE id = target_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'user_id', target_user_id,
        'is_portal_admin', grant_admin
    );
END;
$$;

-- Function: Auto-approve a resource submission and publish to portal_resources
CREATE OR REPLACE FUNCTION public.approve_resource_submission(p_sub_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sub public.portal_submissions%ROWTYPE;
    v_res_id TEXT;
    v_slug TEXT;
BEGIN
    IF NOT public.is_portal_admin() THEN
        RAISE EXCEPTION 'Access denied. Caller is not a portal administrator.';
    END IF;

    SELECT * INTO v_sub FROM public.portal_submissions WHERE id = p_sub_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Submission #% not found.', p_sub_id;
    END IF;

    -- Slugify title
    v_slug := LOWER(REGEXP_REPLACE(COALESCE(v_sub.title, 'resource'), '[^a-zA-Z0-9]+', '-', 'g'));
    v_res_id := COALESCE(v_sub.category, 'resource') || '-' || TRIM(BOTH '-' FROM v_slug);

    INSERT INTO public.portal_resources (
        id,
        category,
        title,
        description,
        url,
        copy_url,
        icon,
        links,
        tags,
        extra_data,
        status,
        sort_order
    )
    VALUES (
        v_res_id,
        COALESCE(v_sub.category, 'materials'),
        COALESCE(v_sub.title, 'Community Resource'),
        COALESCE(v_sub.description, ''),
        COALESCE(v_sub.url, ''),
        COALESCE(v_sub.url, ''),
        jsonb_build_object('type', 'icon', 'class', 'fa-solid fa-link'),
        '[]'::JSONB,
        ARRAY[]::TEXT[],
        COALESCE(v_sub.details, '{}'::JSONB),
        'approved',
        0
    )
    ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        url = EXCLUDED.url,
        status = 'approved',
        updated_at = NOW();

    UPDATE public.portal_submissions
    SET status = 'approved',
        updated_at = NOW()
    WHERE id = p_sub_id;

    RETURN jsonb_build_object(
        'success', true,
        'resource_id', v_res_id,
        'submission_id', p_sub_id
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- STEP 6: Seed Catalog Data (${allRows.length} Items from JSON catalogs)
-- ----------------------------------------------------------------------------
INSERT INTO public.portal_resources (
    id, category, title, description, url, copy_url, icon, links, tags, extra_data, status, sort_order
) VALUES
`;

const valueRows = allRows.map(row => {
    return `(${escapeSql(row.id)}, ${escapeSql(row.category)}, ${escapeSql(row.title)}, ${escapeSql(row.description)}, ${escapeSql(row.url)}, ${escapeSql(row.copy_url)}, ${escapeJson(row.icon)}, ${escapeJson(row.links)}, ${escapeArray(row.tags)}, ${escapeJson(row.extra_data)}, 'approved', ${row.sort_order})`;
});

sql += valueRows.join(',\n') + '\n';
sql += `ON CONFLICT (id) DO UPDATE SET
    category = EXCLUDED.category,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    url = EXCLUDED.url,
    copy_url = EXCLUDED.copy_url,
    icon = EXCLUDED.icon,
    links = EXCLUDED.links,
    tags = EXCLUDED.tags,
    extra_data = EXCLUDED.extra_data,
    status = EXCLUDED.status,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();

-- ----------------------------------------------------------------------------
-- STEP 7: Instructions for Initial Admin Role Setup
-- ----------------------------------------------------------------------------
-- To make your user the default Portal Admin, run:
-- UPDATE public.profiles
-- SET is_portal_admin = true
-- WHERE email = 'your.email@uits.edu.bd';
`;

const queryOut = path.join(__dirname, '..', 'doc', 'query', 'query-5-portal-cms-resources-schema.sql');
const dbOut = path.join(__dirname, '..', 'doc', 'db', 'portal_cms_schema.sql');

fs.writeFileSync(queryOut, sql, 'utf8');
fs.writeFileSync(dbOut, sql, 'utf8');

console.log(`Generated SQL files:\n  ${queryOut}\n  ${dbOut}`);
