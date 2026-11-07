/**
 * oU1TS Portal - Supabase <-> JSON Bidirectional Sync Engine
 * 
 * Synchronizes catalog datasets between local json/*.json files and
 * the Supabase central database (public.portal_resources).
 * 
 * Usage:
 *   node scripts/sync-database.js [sync|push|pull]
 *   sync (default): Compares modification timestamps and keeps the latest version.
 *   push: Overwrites Supabase with content from local json/ files.
 *   pull: Overwrites local json/ files with content from Supabase.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Root directory of repository
const ROOT_DIR = path.resolve(__dirname, '..');
const JSON_DIR = path.join(ROOT_DIR, 'json');
const ENV_CONFIG_PATH = path.join(ROOT_DIR, 'env-config.js');
const ENV_FILE_PATH = path.join(ROOT_DIR, '.env');

// ============================================================================
// 1. CREDENTIALS LOADER & MANAGER
// ============================================================================

function loadCredentials() {
    let supabaseUrl = process.env.SUPABASE_URL || '';
    let anonKey = process.env.SUPABASE_ANON_KEY || '';
    let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    // 1. Read from env-config.js
    if (fs.existsSync(ENV_CONFIG_PATH)) {
        try {
            const content = fs.readFileSync(ENV_CONFIG_PATH, 'utf8');
            const urlMatch = content.match(/SUPABASE_URL:\s*['"]([^'"]+)['"]/);
            const anonMatch = content.match(/SUPABASE_ANON_KEY:\s*['"]([^'"]+)['"]/);
            const roleMatch = content.match(/SUPABASE_SERVICE_ROLE_KEY:\s*['"]([^'"]+)['"]/);

            if (urlMatch && !supabaseUrl) supabaseUrl = urlMatch[1].trim();
            if (anonMatch && !anonKey) anonKey = anonMatch[1].trim();
            if (roleMatch && !serviceRoleKey) serviceRoleKey = roleMatch[1].trim();
        } catch (e) {
            console.warn('[Config] Notice reading env-config.js:', e.message);
        }
    }

    // 2. Read from .env if present
    if (fs.existsSync(ENV_FILE_PATH)) {
        try {
            const content = fs.readFileSync(ENV_FILE_PATH, 'utf8');
            const lines = content.split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) continue;
                const [k, ...vParts] = trimmed.split('=');
                const val = vParts.join('=').trim().replace(/^['"]|['"]$/g, '');
                if (k.trim() === 'SUPABASE_URL' && !supabaseUrl) supabaseUrl = val;
                if (k.trim() === 'SUPABASE_ANON_KEY' && !anonKey) anonKey = val;
                if (k.trim() === 'SUPABASE_SERVICE_ROLE_KEY' && !serviceRoleKey) serviceRoleKey = val;
            }
        } catch (e) {
            console.warn('[Config] Notice reading .env:', e.message);
        }
    }

    return { supabaseUrl, anonKey, serviceRoleKey };
}

function promptQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans.trim());
    }));
}

async function ensureServiceRoleKey(creds) {
    if (creds.serviceRoleKey) return creds.serviceRoleKey;

    console.log('\n----------------------------------------------------------------------');
    console.log('[!] Supabase Row Level Security requires the service_role key to write/sync to the database.');
    console.log('    You can locate your service_role key in:');
    console.log('    Supabase Dashboard -> Project Settings -> API -> Project API keys -> service_role (secret)');
    console.log('----------------------------------------------------------------------\n');

    const enteredKey = await promptQuestion('Enter SUPABASE_SERVICE_ROLE_KEY (or press Enter to cancel): ');
    if (!enteredKey) {
        throw new Error('Push cancelled: service_role key is required to modify database resources.');
    }

    creds.serviceRoleKey = enteredKey;

    const saveChoice = await promptQuestion('Save this key to env-config.js for one-click sync in the future? (Y/n): ');
    if (!saveChoice || saveChoice.toLowerCase() === 'y') {
        saveServiceRoleKeyToConfig(enteredKey);
        console.log('✔ Successfully saved SUPABASE_SERVICE_ROLE_KEY to env-config.js (gitignored).');
    }

    return creds.serviceRoleKey;
}

function saveServiceRoleKeyToConfig(key) {
    if (!fs.existsSync(ENV_CONFIG_PATH)) {
        fs.writeFileSync(ENV_CONFIG_PATH, `window.__ENV = {\n    SUPABASE_SERVICE_ROLE_KEY: '${key}'\n};\n`);
        return;
    }

    let content = fs.readFileSync(ENV_CONFIG_PATH, 'utf8');
    if (content.includes('SUPABASE_SERVICE_ROLE_KEY')) {
        content = content.replace(/SUPABASE_SERVICE_ROLE_KEY:\s*['"][^'"]*['"]/, `SUPABASE_SERVICE_ROLE_KEY: '${key}'`);
    } else {
        // Append before closing brace
        const lastBraceIdx = content.lastIndexOf('}');
        if (lastBraceIdx !== -1) {
            content = content.slice(0, lastBraceIdx) + `    SUPABASE_SERVICE_ROLE_KEY: '${key}',\n` + content.slice(lastBraceIdx);
        } else {
            content += `\nwindow.__ENV.SUPABASE_SERVICE_ROLE_KEY = '${key}';\n`;
        }
    }
    fs.writeFileSync(ENV_CONFIG_PATH, content, 'utf8');
}

// ============================================================================
// 2. DATASET DEFINITIONS & SCHEMAS
// ============================================================================

const DATASETS = [
    { file: 'featured.json', category: 'featured', type: 'featured' },
    { file: 'guidance.json', category: 'guidance', type: 'standard' },
    { file: 'materials.json', category: 'materials', type: 'standard' },
    { file: 'tools.json', category: 'tools', type: 'standard' },
    { file: 'community.json', category: 'community', type: 'standard' },
    { file: 'official.json', category: 'official', type: 'standard' },
    { file: 'portfolios.json', category: 'portfolios', type: 'standard' },
    { file: 'courses.json', category: 'courses', type: 'courses' },
    { file: 'capstones.json', category: 'capstones', type: 'capstones' },
    { file: 'mentors.json', category: 'mentors', type: 'mentors' },
    { file: 'talent.json', category: 'talent', type: 'talent' }
];

// Transform JSON array to Supabase portal_resources rows
function jsonToDbRows(cfg, jsonData) {
    const rows = [];
    const nowIso = new Date().toISOString();

    if (cfg.type === 'featured') {
        jsonData.forEach((item, idx) => {
            rows.push({
                id: item.id || `featured-${idx + 1}`,
                category: 'featured',
                title: item.title || item.alt || 'Featured Initiative',
                description: item.description || '',
                url: item.url || item.visitUrl || '',
                copy_url: item.url || item.visitUrl || '',
                icon: item.img ? { type: 'image', src: item.img } : (item.icon ? { type: 'icon', class: item.icon } : null),
                links: [],
                tags: item.tags || [],
                extra_data: {
                    img: item.img || null,
                    alt: item.alt || item.title || null,
                    icon: item.icon || null
                },
                status: 'approved',
                sort_order: idx + 1,
                updated_at: nowIso
            });
        });
    } else if (cfg.type === 'standard') {
        jsonData.forEach((item, idx) => {
            rows.push({
                id: item.id || `${cfg.category}-${idx + 1}`,
                category: cfg.category,
                title: item.title || 'Untitled',
                description: item.description || '',
                url: item.visitUrl || item.url || '',
                copy_url: item.copyUrl || item.visitUrl || item.url || '',
                icon: item.icon || null,
                links: item.links || [],
                tags: item.tags || [],
                extra_data: item.extra_data || {},
                status: 'approved',
                sort_order: idx + 1,
                updated_at: nowIso
            });
        });
    } else if (cfg.type === 'courses') {
        let courseIdx = 0;
        jsonData.forEach(section => {
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
                rows.push({
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
                    status: 'approved',
                    sort_order: courseIdx,
                    updated_at: nowIso
                });
            });
        });
    } else if (cfg.type === 'capstones') {
        jsonData.forEach((item, idx) => {
            rows.push({
                id: item.id || `capstones-${idx + 1}`,
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
                status: 'approved',
                sort_order: idx + 1,
                updated_at: nowIso
            });
        });
    } else if (cfg.type === 'mentors') {
        jsonData.forEach((item, idx) => {
            rows.push({
                id: item.id || `mentors-${idx + 1}`,
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
                status: 'approved',
                sort_order: idx + 1,
                updated_at: nowIso
            });
        });
    } else if (cfg.type === 'talent') {
        jsonData.forEach((item, idx) => {
            rows.push({
                id: item.id || `talent-${idx + 1}`,
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
                status: 'approved',
                sort_order: idx + 1,
                updated_at: nowIso
            });
        });
    }

    return rows;
}

// Transform Supabase portal_resources rows back into exact JSON structure
function dbRowsToJson(cfg, dbRows) {
    if (!Array.isArray(dbRows)) return [];

    // Sort by sort_order ascending
    const sorted = [...dbRows].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    if (cfg.type === 'featured') {
        return sorted.map(item => {
            const extra = item.extra_data || {};
            const res = {
                url: item.url
            };
            const img = (item.icon && item.icon.src) || extra.img;
            if (img) res.img = img;
            const icon = (item.icon && item.icon.class) || extra.icon;
            if (icon && !img) res.icon = icon;
            if (extra.alt) res.alt = extra.alt;
            res.title = item.title;
            if (item.description) res.description = item.description;
            return res;
        });
    }

    if (cfg.type === 'standard') {
        return sorted.map(item => {
            const res = {
                id: item.id
            };
            if (item.icon) res.icon = item.icon;
            res.title = item.title;
            res.description = item.description || '';
            if (item.url) res.visitUrl = item.url;
            if (item.copy_url && item.copy_url !== item.url) res.copyUrl = item.copy_url;
            if (item.links && item.links.length > 0) res.links = item.links;
            if (item.tags && item.tags.length > 0) res.tags = item.tags;
            return res;
        });
    }

    if (cfg.type === 'courses') {
        const sectionMap = new Map();
        sorted.forEach(item => {
            const extra = item.extra_data || {};
            const catName = extra.course_category || (item.tags && item.tags[0]) || 'General Courses';
            const icon = extra.course_icon || 'fa-solid fa-code';

            if (!sectionMap.has(catName)) {
                sectionMap.set(catName, {
                    category: catName,
                    icon: icon,
                    items: []
                });
            }

            const rawHtml = extra.rawHtml || `<a href="${item.url || '#'}" target="_blank">${item.title}</a><p>${item.description || ''}</p>`;

            sectionMap.get(catName).items.push({
                iconClass: (item.icon && item.icon.class) || 'fa-brands fa-github',
                rawHtml: rawHtml
            });
        });
        return Array.from(sectionMap.values());
    }

    if (cfg.type === 'capstones') {
        return sorted.map(item => {
            const extra = item.extra_data || {};
            return {
                id: item.id,
                title: item.title,
                description: item.description || '',
                batch: extra.batch || 'Batch 51',
                semester: extra.semester || '',
                team: Array.isArray(extra.team) ? extra.team : (extra.team ? [extra.team] : ['UITS Student']),
                visitUrl: item.url || '',
                tags: item.tags || [],
                image: extra.image || (item.icon && item.icon.src) || ''
            };
        });
    }

    if (cfg.type === 'mentors') {
        return sorted.map(item => {
            const extra = item.extra_data || {};
            return {
                id: item.id,
                name: extra.name || item.title,
                title: extra.title || 'Engineer',
                role: extra.role || '',
                company: extra.company || '',
                batch: extra.batch || 'Alumni',
                experience: extra.experience || '',
                stars: extra.stars || 5,
                email: extra.email || '',
                socials: extra.socials || { linkedin: item.url },
                skills: item.tags || []
            };
        });
    }

    if (cfg.type === 'talent') {
        return sorted.map(item => {
            const extra = item.extra_data || {};
            return {
                id: item.id,
                name: extra.name || item.title,
                role: extra.role || 'Developer',
                sector: extra.sector || 'Software',
                bio: extra.bio || item.description || '',
                skills: item.tags || [],
                socials: extra.socials || { linkedin: item.url }
            };
        });
    }

    return sorted;
}

// ============================================================================
// 3. API OPERATIONS (FETCH, UPSERT)
// ============================================================================

async function fetchDbRows(creds, category = null) {
    const key = creds.serviceRoleKey || creds.anonKey;
    let endpoint = `${creds.supabaseUrl}/rest/v1/portal_resources?select=*&status=eq.approved`;
    if (category) {
        endpoint += `&category=eq.${category}`;
    }

    const res = await fetch(endpoint, {
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`
        }
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Supabase query failed (HTTP ${res.status}): ${errorText}`);
    }

    return await res.json();
}

async function upsertDbRows(creds, rows) {
    if (!rows || rows.length === 0) return 0;
    const key = creds.serviceRoleKey;
    if (!key) {
        throw new Error('service_role key is required to upsert rows into Supabase.');
    }

    // Chunk upserts in batches of 50 to avoid request payload limits
    const BATCH_SIZE = 50;
    let totalUpdated = 0;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const chunk = rows.slice(i, i + BATCH_SIZE);
        const endpoint = `${creds.supabaseUrl}/rest/v1/portal_resources?on_conflict=id`;

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates,return=minimal'
            },
            body: JSON.stringify(chunk)
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Failed to upsert rows to Supabase (HTTP ${res.status}): ${errorText}`);
        }
        totalUpdated += chunk.length;
    }

    return totalUpdated;
}

// ============================================================================
// 4. SYNC ACTIONS (PUSH, PULL, SMART-SYNC)
// ============================================================================

async function pullAction(creds) {
    console.log('\n[PULL] Fetching all approved resources from Supabase...');
    const allDbRows = await fetchDbRows(creds);
    console.log(`Fetched ${allDbRows.length} total rows from public.portal_resources.\n`);

    const byCategory = {};
    allDbRows.forEach(row => {
        if (!byCategory[row.category]) byCategory[row.category] = [];
        byCategory[row.category].push(row);
    });

    let updatedFiles = 0;
    for (const cfg of DATASETS) {
        const filePath = path.join(JSON_DIR, cfg.file);
        const rows = byCategory[cfg.category] || [];

        if (rows.length === 0) {
            console.log(`  - ${cfg.file.padEnd(18)} : 0 rows in Supabase, keeping existing local file`);
            continue;
        }

        const transformedJson = dbRowsToJson(cfg, rows);
        fs.writeFileSync(filePath, JSON.stringify(transformedJson, null, 2) + '\n', 'utf8');
        console.log(`  ✔ ${cfg.file.padEnd(18)} : Updated with ${rows.length} records from Supabase`);
        updatedFiles++;
    }

    console.log(`\n✔ Pull complete! Successfully synchronized ${updatedFiles} local JSON file(s).`);
}

async function pushAction(creds) {
    await ensureServiceRoleKey(creds);
    console.log('\n[PUSH] Reading local json/*.json files and uploading to Supabase...');

    let totalUploaded = 0;
    for (const cfg of DATASETS) {
        const filePath = path.join(JSON_DIR, cfg.file);
        if (!fs.existsSync(filePath)) {
            console.log(`  - ${cfg.file.padEnd(18)} : File not found locally, skipping`);
            continue;
        }

        const raw = fs.readFileSync(filePath, 'utf8');
        let parsed;
        try {
            parsed = JSON.parse(raw);
        } catch (e) {
            console.error(`  ✖ ${cfg.file.padEnd(18)} : Invalid JSON syntax!`);
            continue;
        }

        const dbRows = jsonToDbRows(cfg, parsed);
        if (dbRows.length === 0) {
            console.log(`  - ${cfg.file.padEnd(18)} : 0 items to push`);
            continue;
        }

        const count = await upsertDbRows(creds, dbRows);
        console.log(`  ✔ ${cfg.file.padEnd(18)} : Upserted ${count} record(s) to Supabase [category: ${cfg.category}]`);
        totalUploaded += count;
    }

    console.log(`\n✔ Push complete! Successfully uploaded ${totalUploaded} record(s) to Supabase.`);
}

async function smartSyncAction(creds) {
    console.log('\n[SMART SYNC] Comparing modification timestamps between local JSON and Supabase...');
    const allDbRows = await fetchDbRows(creds);

    // Group rows by category and find max updated_at for each category
    const categoryStats = {};
    allDbRows.forEach(row => {
        if (!categoryStats[row.category]) {
            categoryStats[row.category] = { rows: [], maxUpdatedAt: 0 };
        }
        categoryStats[row.category].rows.push(row);
        const rowTime = new Date(row.updated_at || row.created_at).getTime();
        if (rowTime > categoryStats[row.category].maxUpdatedAt) {
            categoryStats[row.category].maxUpdatedAt = rowTime;
        }
    });

    let pushes = [];
    let pulls = [];
    let inSync = [];

    for (const cfg of DATASETS) {
        const filePath = path.join(JSON_DIR, cfg.file);
        const fileExists = fs.existsSync(filePath);
        const stats = categoryStats[cfg.category];

        if (!fileExists && (!stats || stats.rows.length === 0)) {
            continue;
        }

        if (!fileExists && stats && stats.rows.length > 0) {
            pulls.push({ cfg, reason: 'Local file missing, pulling from Supabase' });
            continue;
        }

        const fileMtime = fs.statSync(filePath).mtimeMs;
        const dbTime = stats ? stats.maxUpdatedAt : 0;
        const dbCount = stats ? stats.rows.length : 0;

        // If local file modified more than 2 seconds after database records
        if (fileMtime > dbTime + 2000) {
            pushes.push({ cfg, filePath, reason: `Local file edited more recently (${new Date(fileMtime).toLocaleTimeString()})` });
        } else if (dbTime > fileMtime + 2000 && dbCount > 0) {
            pulls.push({ cfg, reason: `Database records are newer (${new Date(dbTime).toLocaleTimeString()})` });
        } else {
            inSync.push({ cfg });
        }
    }

    console.log(`Status Assessment: ${pushes.length} file(s) to Push, ${pulls.length} file(s) to Pull, ${inSync.length} file(s) in sync.`);

    // Execute pulls
    for (const { cfg, reason } of pulls) {
        const filePath = path.join(JSON_DIR, cfg.file);
        const rows = categoryStats[cfg.category]?.rows || [];
        const transformedJson = dbRowsToJson(cfg, rows);
        fs.writeFileSync(filePath, JSON.stringify(transformedJson, null, 2) + '\n', 'utf8');
        console.log(`  ⬇ [PULL] ${cfg.file.padEnd(18)} : Updated local file (${rows.length} rows) - ${reason}`);
    }

    // Execute pushes
    if (pushes.length > 0) {
        await ensureServiceRoleKey(creds);
        for (const { cfg, filePath, reason } of pushes) {
            const raw = fs.readFileSync(filePath, 'utf8');
            let parsed;
            try {
                parsed = JSON.parse(raw);
            } catch (e) {
                console.error(`  ✖ [SKIP] ${cfg.file.padEnd(18)} : Invalid JSON syntax!`);
                continue;
            }

            const dbRows = jsonToDbRows(cfg, parsed);
            const count = await upsertDbRows(creds, dbRows);
            console.log(`  ⬆ [PUSH] ${cfg.file.padEnd(18)} : Upserted ${count} row(s) to Supabase - ${reason}`);
        }
    }

    for (const { cfg } of inSync) {
        console.log(`  ✔ [OK]   ${cfg.file.padEnd(18)} : Up-to-date with Supabase`);
    }

    console.log('\n✔ Smart Sync completed successfully! All files and database tables are synchronized.');
}

// ============================================================================
// 5. MAIN ENTRY POINT
// ============================================================================

async function main() {
    const creds = loadCredentials();
    if (!creds.supabaseUrl || !creds.anonKey) {
        console.error('✖ Error: Missing Supabase credentials in env-config.js or .env');
        console.error('  Please ensure SUPABASE_URL and SUPABASE_ANON_KEY are specified.');
        process.exit(1);
    }

    const command = (process.argv[2] || 'sync').toLowerCase();

    console.log('======================================================================');
    console.log('  oU1TS Portal - Supabase <-> JSON Sync Engine');
    console.log(`  Target Instance : ${creds.supabaseUrl.replace(/https:\/\/(.*?)\..*/, '$1')}`);
    console.log(`  Execution Mode  : ${command.toUpperCase()}`);
    console.log('======================================================================');

    try {
        if (command === 'pull') {
            await pullAction(creds);
        } else if (command === 'push') {
            await pushAction(creds);
        } else if (command === 'sync') {
            await smartSyncAction(creds);
        } else {
            console.error(`Unknown command: "${command}". Available options: sync, push, pull`);
            process.exit(1);
        }
    } catch (err) {
        console.error('\n✖ Sync Failed:', err.message);
        process.exit(1);
    }
}

main();

