-- ============================================================================
-- QUERY 6: GOOGLE SHEETS FORM SUBMISSIONS TRACKING TABLE
-- Database: Central Supabase Instance
-- Purpose:
--   1. Create public.portal_sheet_submissions to record all Google Sheet form responses.
--   2. Identify each submission by sheet_row_id (e.g. sheet_row_2, sheet_row_14).
--   3. Automatically track existing projects added to the website vs not yet added.
--   4. Seed all 13 existing submissions with pre-mapped resource IDs and status.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.portal_sheet_submissions (
    sheet_row_id TEXT PRIMARY KEY,
    sheet_row_number INTEGER UNIQUE NOT NULL,
    submitted_at TEXT,
    submitter_email TEXT,
    student_id TEXT,
    submission_for TEXT,
    submitter_name TEXT,
    submitter_social TEXT,
    project_title TEXT,
    project_link TEXT,
    project_type TEXT,
    portfolio_expertise TEXT,
    department TEXT,
    batch TEXT,
    additional_details TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'already_added', 'feedback')),
    mapped_resource_id TEXT REFERENCES public.portal_resources(id) ON DELETE SET NULL,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sheet_subs_status ON public.portal_sheet_submissions(status);
CREATE INDEX IF NOT EXISTS idx_sheet_subs_type ON public.portal_sheet_submissions(project_type);
CREATE INDEX IF NOT EXISTS idx_sheet_subs_row ON public.portal_sheet_submissions(sheet_row_number);

-- Enable RLS
ALTER TABLE public.portal_sheet_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read sheet submissions" ON public.portal_sheet_submissions;
DROP POLICY IF EXISTS "Admin manage sheet submissions" ON public.portal_sheet_submissions;

CREATE POLICY "Allow read sheet submissions"
    ON public.portal_sheet_submissions
    FOR SELECT
    USING (true);

CREATE POLICY "Admin manage sheet submissions"
    ON public.portal_sheet_submissions
    FOR ALL
    USING (public.is_portal_admin())
    WITH CHECK (public.is_portal_admin());

-- Pre-seed all existing sheet rows
INSERT INTO public.portal_sheet_submissions (
    sheet_row_id, sheet_row_number, submitted_at, submitter_email, student_id,
    submission_for, submitter_name, submitter_social, project_title, project_link,
    project_type, portfolio_expertise, department, batch, additional_details,
    status, mapped_resource_id
) VALUES
('sheet_row_2', 2, '1/28/2026 21:57:05', 'soyebakram05@gmail.com', '04324205101089', 'Adding Resource', 'Soyeb Akram ', 'https://www.facebook.com/share/1DdononXtU/', 'Hand_gesture_control_system', 'https://github.com/SoyebAkram/Hand_Gesture_control__system', 'Tools', '', 'CSE', '56', '', 'already_added', 'tools-handgesture'),
('sheet_row_3', 3, '1/28/2026 23:52:55', '0432310005101096@uits.edu.bd', '0432310005101096@uits.edu.bd', 'Adding Resource', 'Md. Robiul Hassan', '+8801997601347 (WhatsApp)', 'Building-a-To-Do-List-Application-with-C', 'https://drive.google.com/drive/u/0/folders/1sQzOBsZK6u9HCRU-uO0Jdg8c7LRak4XL', 'Course Repositories', '', 'CSE', '53', '', 'already_added', 'courses-dsa1-robiul'),
('sheet_row_4', 4, '1/30/2026 17:54:56', 'md.sakib.hos3n@gmail.com', '0432220005101058', 'Adding Resource', 'Md. Sakib Hosen', 'https://www.facebook.com/sakib.the.jnr.chatok', 'Portfolio', 'https://iamchatokjunior.netlify.app/', 'Portfolios', 'Full Stack Developer', 'CSE', '52', '', 'already_added', 'portfolio-chatokjnr'),
('sheet_row_5', 5, '2/1/2026 1:16:14', '0432220005101079@uits.edu.bd', '0432220005101079@uits.edu.bd', 'Adding Resource', 'Atik Shahria Opu ', 'https://www.facebook.com/atikshahriaopu', 'Portfolio - atikshahriaopu', 'https://atikshahriaopu.netlify.app/', 'Portfolios', 'Web Developer', 'CSE', '52', '', 'already_added', 'portfolio-atikshahria'),
('sheet_row_6', 6, '2/7/2026 10:51:35', '0432310005101096@uits.edu.bd', '0432310005101096@uits.edu.bd', 'Adding Resource', 'Md. Robiul Hassan ', 'WhatsApp: +8801997601347', 'Computer Graphics and Multimedia Lab ', 'https://github.com/Arriesgado47/Graphics-Lab', 'Course Repositories', '', 'CSE', '53', 'These are Lab Reports for the course CGM lab. Enjoy...🤍', 'already_added', 'courses-cg-Arriesgado47'),
('sheet_row_7', 7, '2/10/2026 13:53:07', '0432220005101041@uits.edu.bd', '0432220005101041@uits.edu.bd', 'Adding Resource', 'Nafiz Al Zawad ', 'contact@zawad.dev', 'Personal Portfolio', 'https://zawad.dev/', 'Portfolios', 'QA Engineer & Automation Specialist', 'CSE', '52', '', 'already_added', 'portfolio-#'),
('sheet_row_8', 8, '3/10/2026 4:25:25', 'azhar_uddin1120@uits.edu.bd', 'azhar_uddin1120@uits.edu.bd', 'Adding Resource', 'KAZI MD AZHAR UDDIN ABEER', 'https://dinq.me/4xrhd', 'UITS RESEARCH ARCHIVE,  A unified ecosystem for thesis preservation, collaborative research, and scholarly excellence. ', 'https://research-uits.rf.gd/', 'Materials', '', 'CSE', '54', 'Before you embark on your next thesis, ensure your foundation is solid. Access a unified ecosystem designed for thesis preservation, collaborative research, and scholarly excellence. Discover the work that came before you to build the breakthroughs of tomorrow.', 'already_added', 'capstone-research-archive'),
('sheet_row_9', 9, '3/17/2026 2:26:49', 'azhar_uddin1120@uits.edu.bd', 'azhar_uddin1120@uits.edu.bd', 'Adding Resource', 'KAZI MD AZHAR UDDIN ABEER', 'http://fb.me/4xrhd', 'গবেষণা প্রকাশের সম্পূর্ণ গাইড', 'https://lnkd.in/gP2cZT-j', 'Guidance', '', 'CSE', '54', 'এই বইটি বিশেষভাবে উপযোগীঃ
- অনার্স ও মাস্টার্স শিক্ষার্থী
- PhD গবেষক
- নতুন ও আগ্রহী গবেষক
- যারা বিদেশে উচ্চশিক্ষা বা একাডেমিক ক্যারিয়ার গড়তে চান
গবেষণা শুধু পেপার লেখা না, এটি একটি দীর্ঘমেয়াদি কৌশল। সেই কৌশলটাকেই সহজভাবে সাজিয়ে দিয়েছি এই ছোট বইটিতে।', 'already_added', 'guidance-research-pub'),
('sheet_row_10', 10, '3/17/2026 17:02:01', 'azhar_uddin1120@uits.edu.bd', 'Azhar_uddin1120@uits.edu.bd', 'Adding Resource', 'KAZI MD AZHAR UDDIN ABEER', 'fb.me/4xrhd', 'Computer Graphics & Multimedia', 'https://github.com/4xrhd/CGM_LAB', 'Course Repositories', '', 'CSE', '54', '', 'already_added', 'courses-cg-4xrhd'),
('sheet_row_11', 11, '3/18/2026 3:41:53', 'azhar_uddin1120@uits.edu.bd', 'azhar_uddin1120@uits.edu.bd', 'Adding Resource', 'KAZI MD AZHAR UDDIN ABEER', 'http://fb.me/4xrhd', 'All Cse Labs (OLD Curriculum)', 'https://github.com/4xrhd/cse-lab-course', 'Course Repositories', '', 'CSE', '54', '', 'already_added', 'courses-all-4xrhd'),
('sheet_row_12', 12, '3/24/2026 18:38:40', 'msohan2420186@bscse.uiu.ac.bd', 'msohan2420186@bscse.uiu.ac.bd', 'Suggestion/Fix', 'Naimur Rahman', 'msohan2420186@bscse.uiu.ac.bd', 'Requiring accredition', 'https://o-u1ts-portal.vercel.app/#', 'FEEDBACK', '', 'CSE', '', 'https://o-u1ts-portal.vercel.app/#  in this website, there''s no credit of https://uiulinks.vercel.app

https://ou1ts-portal.netlify.app/    this one has below redesign inspired credit.', 'feedback', NULL),
('sheet_row_13', 13, '3/28/2026 19:15:32', 'azhar_uddin1120@uits.edu.bd', 'azhar_uddin1120@uits.edu.bd', 'Suggestion/Fix', 'KAZI MD AZHAR UDDIN ABEER', 'http://4xrhd.rf.gd', 'গবেষণা প্রকাশের সম্পূর্ণ গাইড [4xrhd]', 'https://www.supportkori.com/4xrhd/extras/complete-guide-to-research-publishing-banglav100-azhar-uddin-l17g', 'Guidance', '', 'CSE', '54', 'CHANGE THE FILE LINK,
https://www.supportkori.com/4xrhd/extras/complete-guide-to-research-publishing-banglav100-azhar-uddin-l17g


 
', 'already_added', 'guidance-research-pub'),
('sheet_row_14', 14, '5/19/2026 10:58:50', '0432410005101083@uits.edu.bd', '0432410005101083', 'Adding Resource', 'Shalehin Ahmed Ornob ', 'https://www.facebook.com/share/1F3wdeBD6A/', 'Puzzle Solver', 'https://github.com/ORNOB-083/AI-Lab-Project-Puzzle-Solver', 'Course Repos', '', 'CSE', '55', '', 'pending', NULL)
ON CONFLICT (sheet_row_id) DO UPDATE SET
    submitted_at = EXCLUDED.submitted_at,
    submitter_email = EXCLUDED.submitter_email,
    student_id = EXCLUDED.student_id,
    submission_for = EXCLUDED.submission_for,
    submitter_name = EXCLUDED.submitter_name,
    submitter_social = EXCLUDED.submitter_social,
    project_title = EXCLUDED.project_title,
    project_link = EXCLUDED.project_link,
    project_type = EXCLUDED.project_type,
    portfolio_expertise = EXCLUDED.portfolio_expertise,
    department = EXCLUDED.department,
    batch = EXCLUDED.batch,
    additional_details = EXCLUDED.additional_details,
    status = EXCLUDED.status,
    mapped_resource_id = EXCLUDED.mapped_resource_id,
    updated_at = NOW();

-- ----------------------------------------------------------------------------
-- RPC Helper: Approve a Google Sheet submission and publish to portal_resources
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.approve_sheet_submission(
    p_sheet_row_id TEXT,
    p_resource_id TEXT,
    p_category TEXT,
    p_title TEXT,
    p_url TEXT,
    p_description TEXT DEFAULT '',
    p_tags TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_res RECORD;
BEGIN
    -- Check admin privileges
    IF NOT public.is_portal_admin() THEN
        RAISE EXCEPTION 'Access Denied: Only Portal Administrators can approve submissions.';
    END IF;

    -- Upsert resource into public.portal_resources
    INSERT INTO public.portal_resources (
        id, category, title, description, url, copy_url, tags, status, sort_order
    ) VALUES (
        p_resource_id,
        p_category,
        p_title,
        p_description,
        p_url,
        p_url,
        p_tags,
        'approved',
        0
    )
    ON CONFLICT (id) DO UPDATE SET
        category = EXCLUDED.category,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        url = EXCLUDED.url,
        copy_url = EXCLUDED.copy_url,
        tags = EXCLUDED.tags,
        status = 'approved',
        updated_at = NOW()
    RETURNING * INTO v_new_res;

    -- Update sheet submission status
    UPDATE public.portal_sheet_submissions
    SET
        status = 'approved',
        mapped_resource_id = p_resource_id,
        admin_notes = COALESCE(admin_notes, '') || ' Approved and published on ' || NOW()::TEXT,
        updated_at = NOW()
    WHERE sheet_row_id = p_sheet_row_id;

    RETURN to_jsonb(v_new_res);
END;
$$;

