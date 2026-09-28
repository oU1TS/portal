### # oU1TS portal

This project is an Academic Resources Portal called **oU1TS Portal** designed to serve as a centralized hub for UITS students to discover and access academic resources, projects, and community platforms. 

- **Interactive Preloader & Typewriter Branding**: Features a centered introductory preloader that glides into the top-left logo, followed by a left-to-right typewriter animation displaying the portal's tagline and resource badges.
- **Featured Projects Showcase**: An automated, interactive rotating gallery highlighting top-ranked projects with dynamic rankings, responsive dual-column mobile layout, and pagination indicators.
- **Playful Floating Navigation Canvas**: An organic bubble canvas for quick discovery across study materials, developer tools, course repositories, guidance tutorials, official links, inspirations, capstones, and mentors.
- **Single Page Application (SPA) Subviews**: Dynamic in-place subviews powered by universal JSON data rendering without full page reloads.
- **Visitor Changelog Modal**: An automated "What's New" changelog modal tracking releases (`changes.json`) with Service Worker version detection, desktop floating button, and mobile menu trigger.
- **Centralized Database & Star Ranking System**: Connected directly to the centralized oU1TS Supabase database (`ou1ts.github.io`), featuring unified Google OAuth & student credentials, auto-project tagging (`'portal'`), dynamic stars ranking across JSON resources, and user profile metrics. Full SQL setup script: [`doc/query/query-4-central-db-portal-stars.sql`](doc/query/query-4-central-db-portal-stars.sql) (see [`doc/db/CENTRAL_DATABASE_SETUP_GUIDE.md`](doc/db/CENTRAL_DATABASE_SETUP_GUIDE.md)).
- **Portal CMS & Project-Scoped Admin Role Delegation**: Full administrative Content Management System ([`js/cms.js`](js/cms.js)) allowing designated admins to approve community resources, auto-arrange catalog listings across 10 categories directly in Supabase (`public.portal_resources`), manage Google Form feedback (`public.portal_submissions`), and delegate portal admin roles using a dedicated User Selector Modal. Migration script: [`doc/query/query-5-portal-cms-resources-schema.sql`](doc/query/query-5-portal-cms-resources-schema.sql).

<br>

### # Tech Stack

<div align=center>
  
  <img style="margin:auto;" width="478" height="426" alt="image" src="https://github.com/user-attachments/assets/fc4f9f42-28a2-456c-8146-d447e712afb2" />
<p>I used Google Sheets for contributions.html : )</p>
  <p>using <a href="https://chromewebstore.google.com/detail/wappalyzer-technology-pro/gppongmhjkpfnbhagpmjfkannfbllamg?hl=en">Wappalyzer</a></p>

</div>

<br>

<h1 align=center>👉 <a href="https://github.com/b1tranger/ou1ts.portal/blob/main/doc/DOCUMENTATION.md">DOCUMENTATION</a> 👈</h1>

### # References:
- https://o-u1ts-portal.vercel.app/ | [Mahfuz5634/oU1TS-Portal](https://github.com/Mahfuz5634/oU1TS-Portal)
- https://uiulinks.vercel.app/

<br><br><br><br>

### # check also
visit: https://github.com/oU1TS/.github/wiki/SSR-Projects
