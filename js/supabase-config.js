// Supabase Configuration
// Credentials are loaded from window.__ENV (set by env-config.js locally,
// or injected by GitHub Actions at deploy time in production).
// DO NOT hardcode credentials here — keep this file safe to commit.

(function () {
    const url = window.__ENV?.SUPABASE_URL;
    const key = window.__ENV?.SUPABASE_ANON_KEY;

    if (!url || !key || url.includes('YOUR-NEW-PROJECT-ID')) {
        console.error(
            '[supabase-config] Missing credentials.\n' +
            'Local dev: fill in env-config.js with your Supabase URL and anon key.\n' +
            'Production: ensure GitHub Actions secrets SUPABASE_URL and SUPABASE_ANON_KEY are set.'
        );
        window.supabaseClient = null;
        return;
    }

    try {
        if (typeof supabase === 'undefined') {
            throw new Error('Supabase library not loaded. Make sure the CDN script is included before this file.');
        }

        window.supabaseClient = supabase.createClient(url, key);
        console.log('Supabase client initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Supabase client:', error);
        window.supabaseClient = null;
    }
})();
