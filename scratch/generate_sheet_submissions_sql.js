const fs = require('fs');
const path = require('path');
const https = require('https');

const sheetUrl = 'https://docs.google.com/spreadsheets/d/1oQ5Mkavjm62UGZwNjM-52yvKppWZHfX-Qpq6jtEVIOY/gviz/tq?tqx=out:json';

function escapeSql(str) {
    if (str === null || str === undefined) return "''";
    return "'" + String(str).replace(/'/g, "''") + "'";
}

// Load catalog to pre-map
const catalog = [];
const jsonDir = path.join(__dirname, '..', 'json');
const files = fs.readdirSync(jsonDir);
files.forEach(f => {
    if (!f.endsWith('.json')) return;
    const data = JSON.parse(fs.readFileSync(path.join(jsonDir, f), 'utf8'));
    const items = Array.isArray(data) ? data : [];
    items.forEach(item => {
        if (item.items) {
            item.items.forEach(sub => catalog.push({ id: sub.id, title: sub.title || '', url: sub.url || sub.visitUrl || '', rawHtml: sub.rawHtml || '', file: f }));
        } else {
            catalog.push({ id: item.id, title: item.title || item.name || '', url: item.visitUrl || item.url || '', file: f });
        }
    });
});

https.get(sheetUrl, (res) => {
    let raw = '';
    res.on('data', c => raw += c);
    res.on('end', () => {
        const jsonStr = raw.substring(raw.indexOf('(') + 1, raw.lastIndexOf(')'));
        const gData = JSON.parse(jsonStr);

        let sql = `-- ============================================================================
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
`;

        const rows = gData.table.rows || [];
        const valueLines = [];

        rows.forEach((r, idx) => {
            const rowNum = idx + 2;
            const sheetRowId = `sheet_row_${rowNum}`;
            const time = r.c[0] ? (r.c[0].f || r.c[0].v || '') : '';
            const email = r.c[1] ? (r.c[1].v || '') : '';
            const studentId = r.c[2] ? String(r.c[2].v || '') : '';
            const submissionFor = r.c[3] ? (r.c[3].v || '') : '';
            const name = r.c[4] ? (r.c[4].v || '') : '';
            const social = r.c[5] ? (r.c[5].v || '') : '';
            const projectTitle = r.c[6] ? (r.c[6].v || '') : '';
            const projectLink = r.c[7] ? (r.c[7].v || '') : '';
            const projectType = r.c[8] ? (r.c[8].v || '') : '';
            const expertise = r.c[9] ? (r.c[9].v || '') : '';
            const department = r.c[10] ? (r.c[10].v || '') : '';
            const batch = r.c[11] ? String(r.c[11].v || '') : '';
            const details = r.c[12] ? (r.c[12].v || '') : '';

            // Match against catalog
            let matched = catalog.find(c => {
                if (projectLink && c.url && (c.url.toLowerCase() === projectLink.toLowerCase() || c.url.includes(projectLink) || projectLink.includes(c.url))) return true;
                if (projectLink && c.rawHtml && c.rawHtml.toLowerCase().includes(projectLink.toLowerCase())) return true;
                if (projectTitle && c.title && c.title.toLowerCase().includes(projectTitle.toLowerCase())) return true;
                return false;
            });

            const isFeedback = (projectType && projectType.toUpperCase().includes('FEEDBACK')) || (submissionFor && submissionFor.toUpperCase().includes('FEEDBACK'));
            let status = 'pending';
            let mappedId = null;

            if (isFeedback) {
                status = 'feedback';
            } else if (matched) {
                status = 'already_added';
                mappedId = matched.id;
            } else {
                status = 'pending'; // Needs approval!
            }

            valueLines.push(`(${escapeSql(sheetRowId)}, ${rowNum}, ${escapeSql(time)}, ${escapeSql(email)}, ${escapeSql(studentId)}, ${escapeSql(submissionFor)}, ${escapeSql(name)}, ${escapeSql(social)}, ${escapeSql(projectTitle)}, ${escapeSql(projectLink)}, ${escapeSql(projectType)}, ${escapeSql(expertise)}, ${escapeSql(department)}, ${escapeSql(batch)}, ${escapeSql(details)}, ${escapeSql(status)}, ${mappedId ? escapeSql(mappedId) : 'NULL'})`);
        });

        sql += valueLines.join(',\n') + '\n';
        sql += `ON CONFLICT (sheet_row_id) DO UPDATE SET
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
`;

        const qPath = path.join(__dirname, '..', 'doc', 'query', 'query-6-portal-sheet-submissions.sql');
        const dbPath = path.join(__dirname, '..', 'doc', 'db', 'portal_sheet_submissions.sql');
        fs.writeFileSync(qPath, sql, 'utf8');
        fs.writeFileSync(dbPath, sql, 'utf8');
        console.log(`Successfully generated:\n  ${qPath}\n  ${dbPath}`);
    });
});
