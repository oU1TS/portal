-- ============================================================================
-- QUERY 7: PORTAL ADMIN DELEGATION & USER PROVISIONING
-- Database: Central Supabase Instance
-- Purpose:
--   1. Allow portal administrators to add, pre-provision, or update users in public.profiles.
--   2. Grant or revoke is_portal_admin privileges by Email or Student ID.
--   3. Ensure 'portal' is included in project_tags for ecosystem visibility.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.add_or_grant_portal_user(
    p_email TEXT,
    p_full_name TEXT DEFAULT '',
    p_student_id TEXT DEFAULT '',
    p_department TEXT DEFAULT '',
    p_batch TEXT DEFAULT '',
    p_is_admin BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_profile RECORD;
    v_user_id UUID;
    v_clean_email TEXT;
BEGIN
    -- Check admin privileges
    IF NOT public.is_portal_admin() THEN
        RAISE EXCEPTION 'Access Denied: Only existing Portal Administrators can add or delegate users.';
    END IF;

    v_clean_email := LOWER(TRIM(p_email));

    IF v_clean_email IS NULL OR v_clean_email = '' THEN
        RAISE EXCEPTION 'Valid email address is required.';
    END IF;

    -- Check if user already exists by email in public.profiles
    SELECT * INTO v_profile 
    FROM public.profiles 
    WHERE LOWER(email) = v_clean_email;

    IF v_profile.id IS NOT NULL THEN
        -- Update existing profile: tag with 'portal' and update admin status & metadata
        UPDATE public.profiles
        SET 
            is_portal_admin = p_is_admin,
            project_tags = CASE 
                WHEN 'portal' = ANY(project_tags) THEN project_tags 
                ELSE array_append(project_tags, 'portal') 
            END,
            full_name = CASE WHEN p_full_name <> '' THEN p_full_name ELSE full_name END,
            student_id = CASE WHEN p_student_id <> '' THEN p_student_id ELSE student_id END,
            department = CASE WHEN p_department <> '' THEN p_department ELSE department END,
            batch = CASE WHEN p_batch <> '' THEN p_batch ELSE batch END,
            updated_at = NOW()
        WHERE id = v_profile.id
        RETURNING * INTO v_profile;

        RETURN jsonb_build_object(
            'success', true,
            'action', 'updated',
            'user', to_jsonb(v_profile)
        );
    ELSE
        -- Pre-provision a profile record so when the student signs in with Google OAuth
        -- or email, their profile and admin rights are already configured.
        v_user_id := gen_random_uuid();
        INSERT INTO public.profiles (
            id,
            email,
            full_name,
            student_id,
            department,
            batch,
            is_portal_admin,
            project_tags,
            created_at,
            updated_at
        ) VALUES (
            v_user_id,
            v_clean_email,
            p_full_name,
            p_student_id,
            p_department,
            p_batch,
            p_is_admin,
            ARRAY['portal'],
            NOW(),
            NOW()
        )
        RETURNING * INTO v_profile;

        RETURN jsonb_build_object(
            'success', true,
            'action', 'created',
            'user', to_jsonb(v_profile)
        );
    END IF;
END;
$$;
