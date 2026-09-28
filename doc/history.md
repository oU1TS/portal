<!--
Tags: [portal, release-notes, changelog, history, preloader, typewriter, gallery, auto-scroll, service-worker]
-->

# 28.09.26

### **Production 404 Fixes: env-config.js, Service Worker & Favicon (v3.2)**
- **Deploy Workflow Fix ([`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml))**:
  - Root cause: `peaceiris/actions-gh-pages` respects `.gitignore`, so the generated `env-config.js` was never included in the deploy, causing `env-config.js 404` on every page load and `supabaseClient = null`.
  - Fix: Added a `rsync` staging step to copy the full working directory (including the generated `env-config.js`) into `_site/`, then deploy from `_site/`.
  - Fixed heredoc quoting bug: the heredoc used `'ENVEOF'` (no variable expansion) — switched to unquoted `ENVEOF` with `$SUPABASE_URL` / `$SUPABASE_ANON_KEY` shell vars so secrets are correctly interpolated.
  - Also excluded `scratch` and `temp_backup` from the deployed site.
- **Service Worker Registration Path Fix ([`script.js`](../script.js))**:
  - Was registered at `/service-worker.js` (root-absolute), but site lives at `/portal/` on GitHub Pages — causing a 404 on the SW fetch.
  - Fix: Derives `basePath` dynamically via `window.location.pathname.replace(/\/[^/]*$/, '/')`, registering the SW as `basePath + 'service-worker.js'` with matching `scope: basePath`.
- **Favicon 404 Fix ([`index.html`](../index.html))**:
  - Added `<link rel="icon" href="icons/icon.webp" type="image/webp">` to silence the automatic `/favicon.ico` browser request.
- **manifest.json Scope Fix ([`manifest.json`](../manifest.json))**:
  - `start_url` updated to `/portal/`; `scope` added as `/portal/` for correct PWA installation on GitHub Pages.
- **Cache Version**: `ou1ts-portal-v3.2` in [`service-worker.js`](../service-worker.js) to purge old cached JS referencing the defunct Vercel backend.

### **Profile Icon Header Button & Profile-Page Logout Relocation**

- **Compact Profile Icon Button (`#userInfo`, `#userProfileBtn`, `.user-details-dropdown` in [`index.html`](../index.html) & [`style.css`](../style.css))**:
  - Replaced the wide `.user-info` header bar (which showed student ID, email, and a logout icon) with a minimal `<a class="auth-btn user-profile-btn">` profile icon button that occupies the exact same space as the Login button.
  - Profile details (`.user-details-dropdown`) now appear in a frosted-glass popdown (glassmorphic backdrop, purple-tinted border, arrow pointer) when hovering or focusing the profile icon.
  - Dropdown fades in with a smooth `translateY` animation and closes on mouse-out.
- **Logout Button Moved to Profile Page ([`index.html`](../index.html) & [`js/spa-controller.js`](../js/spa-controller.js) & [`js/auth.js`](../js/auth.js))**:
  - Removed the logout icon button from the header `#userInfo` block entirely.
  - Added a `.profile-logout-btn` button inside the `#profileView .back-btn-container` so it appears right-aligned at the same height as the "← Back to Hub" link.
  - Logout button is hidden by default (`style="display: none;"`) and shown/hidden dynamically by `Auth.updateUI()` and `SPA.renderProfileView()` based on session state.
  - `.back-btn-container` updated to `display: flex; justify-content: space-between;` so back link and logout sit on opposite ends.
  - `.profile-logout-btn` styled with a red-tinted glassmorphic look, hover glow, and text label "Logout" alongside the logout icon.
- **Service Worker & Visitor Changelog**:
  - Bumped cache version in [`service-worker.js`](../service-worker.js) to `ou1ts-portal-v3.1`.
  - Added `v3.1` entry to [`changes.json`](../changes.json).

### **Mobile CMS Submissions Dropdown Filters & Collapsible Card Accordions**
- **Mobile Container Width & Reduced Padding ([`style.css`](../style.css))**:
  - Enforced `.cms-inline-workspace` to strictly occupy `width: 95% !important; max-width: 95% !important; margin: 0.5rem auto !important;` with compact padding (`0.85rem 0.65rem`) on mobile viewports (`max-width: 768px`).
  - Streamlined `#cmsView.category-page` on mobile with `padding: 1rem 0 !important;` ensuring proper centering and eliminating unwanted outer gutters.
- **Unified Mobile Submissions Filter Dropdown ([`js/cms.js`](../js/cms.js) & [`style.css`](../style.css))**:
  - Integrated "💬 Feedbacks" directly into the `<select id="cmsMobileSubFilter">` options alongside "All Submissions", "⚠️ Needs Approval", and "✅ Already on Website".
  - Removed the standalone mobile Feedback button, providing a single, seamless, full-width dropdown control for instant mobile category filtering.
- **Collapsible Submission Card Accordions ([`js/cms.js`](../js/cms.js) & [`style.css`](../style.css))**:
  - Converted `.cms-submission-card` items into clean accordions for mobile screens:
    - Default/collapsed view: displays only the card header (`.cms-sub-card-header`), showing the category badge, sheet row number, status tag, resource title, and animated chevron indicator.
    - Expanded view (`.is-expanded`): tapping the header smoothly reveals the complete submission body (`.cms-sub-card-body`), including description notes, submitter metadata, project URL, catalog mapping ID, and approval/rejection actions.
    - Added `CMS.toggleSubmissionCard()` to handle touch-friendly accordion toggling without intercepting clicks on internal action buttons or links.
    - Maintained standard multi-column grid and fully visible cards on desktop screens.
- **Service Worker & Visitor Changelog**:
  - Bumped cache version in [`service-worker.js`](../service-worker.js) to `ou1ts-portal-v3.0`.
  - Added `v3.0` entry to [`changes.json`](../changes.json).

### **Canonical URLs & Automated Netlify-to-GitHub Pages Redirection**
- **Domain Redirection Script ([`index.html`](../index.html) & [`contributions.html`](../contributions.html))**:
  - Implemented client-side automatic redirection for incoming visitors on legacy Netlify hostnames (`ou1ts-portal.netlify.app` and `ouits-res.netlify.app`).
  - Seamlessly redirects visitors to the central GitHub Pages deployment origin `https://ou1ts.github.io/portal/`.
  - Automatically preserves subpaths (e.g. `contributions.html`), query parameters (`window.location.search`), and SPA hash routes (`window.location.hash`, e.g. `#cms`, `#profile`, `#capstones`).
- **Canonical Meta Links ([`index.html`](../index.html) & [`contributions.html`](../contributions.html))**:
  - Added `<link rel="canonical" href="https://ou1ts.github.io/portal/">` in `index.html`.
  - Added `<link rel="canonical" href="https://ou1ts.github.io/portal/contributions.html">` in `contributions.html`.
- **Service Worker & Visitor Changelog**:
  - Bumped cache version in [`service-worker.js`](../service-worker.js) to `ou1ts-portal-v2.9`.
  - Added `v2.9` entry to [`changes.json`](../changes.json).

### **Wide CMS Workspace Layout, Mobile Tab Icons & Submissions Dropdown Navigation**
- **Unified Dedicated Wide Layout for Portal Admin CMS ([`style.css`](../style.css), [`index.html`](../index.html) & [`js/cms.js`](../js/cms.js))**:
  - Replaced the redundant floating `#adminCmsModal` with direct navigation to the dedicated `#cms` SPA route, eliminating duplicate DOM markup, dual container IDs, and redundant backdrop overlays.
  - Updated the header "Admin CMS" launcher button in [`index.html`](../index.html) to link directly to `<a href="#cms">` with smooth routing.
  - Expanded `#cmsView.category-page` and `.cms-inline-workspace` to `max-width: 1440px` and `width: 95%`, providing spacious multi-column layouts for Google Sheets submissions and administrative delegation tables.
- **Mobile Screen Width Tab Buttons Shortening ([`js/cms.js`](../js/cms.js) & [`style.css`](../style.css))**:
  - Wrapped tab button label text inside `<span class="cms-tab-label">...</span>` and added tooltip titles to each button.
  - On mobile screens (`max-width: 768px`), automatically hid `.cms-tab-label`, displaying clean icons with count badges so all 4 tabs fit neatly side-by-side on any mobile device without horizontal overflow.
- **Mobile Dropdown for Submissions Listings ([`js/cms.js`](../js/cms.js) & [`style.css`](../style.css))**:
  - Consolidated the resource submission filter pills (`All Submissions`, `Needs Approval`, `Already on Website`) into an intuitive `<select id="cmsMobileSubFilter">` dropdown on mobile viewports (`max-width: 768px`).
  - Preserved the `Feedback` button as a dedicated quick-access pill alongside the dropdown.
  - Maintained the full horizontal pill bar on desktop viewports.
- **Service Worker & Visitor Changelog**:
  - Bumped cache version in [`service-worker.js`](../service-worker.js) to `ou1ts-portal-v2.8`.
  - Added `v2.8` entry to [`changes.json`](../changes.json).

### **CMS Submissions Styling, Role Selector Refinement & Admin Delegation Safeguards**
- **Lighter Submitter Contact Link Styling ([`style.css`](../style.css) & [`js/cms.js`](../js/cms.js))**:
  - Enhanced the "Submitter Contact/Social" link under Google Sheet Form Submissions with `.cms-social-link` and `.cms-sub-meta a` styled in a lighter sky-blue tone (`#93c5fd`) with hover glow (`#ffffff`), improving contrast and readability against dark submission cards.
- **Admin Delegation Role Selector & Edit Profile Button Styling ([`style.css`](../style.css))**:
  - Implemented custom glassmorphic styling for `#cmsUserRoleFilter` and `#cmsCategoryFilter` dropdowns with styled arrows, rounded corners, dark slate backgrounds (`rgba(30, 41, 59, 0.8)`), and purple focus rings.
  - Styled the "Edit Student Profile" button (`.cms-btn-icon.edit`) with a 32x32px rounded container, subtle border, and sky-blue hover glow.
  - Added dedicated layout and search styling for `.cms-filters-bar` and `.cms-search-box`.
- **Sole Administrator Revoke Protection ([`js/cms.js`](../js/cms.js) & [`style.css`](../style.css))**:
  - When only a single administrator exists (`adminCount <= 1`), the "Revoke" button automatically renders as disabled and read-only with a lock icon and tooltip: *"Cannot revoke the sole portal administrator. At least one administrator is required."*
  - Added a defensive runtime check inside `CMS.toggleUserAdmin()` to strictly block any attempt to revoke the last remaining administrator.
- **Add Regular Users Only in Modal & User List Admin Toggling ([`js/cms.js`](../js/cms.js))**:
  - Updated the "Add User" workflow so that adding a user from `#cmsUserModal` is strictly dedicated to adding regular portal members (`isAdmin = false`), preventing accidental direct admin creation from the form.
  - Displayed an informative banner informing administrators that role promotion/elevation is handled directly via the "Grant Admin" / "Revoke" action buttons in the user table.
  - Preserved existing admin status during student profile edits (`openEditUserModal`).
- **Service Worker & Visitor Changelog**:
  - Bumped cache version in [`service-worker.js`](../service-worker.js) to `ou1ts-portal-v2.7`.
  - Added `v2.7` entry to [`changes.json`](../changes.json).

### **User Provisioning & Role Management in CMS Admin Delegation**
- **User Addition & Pre-Provisioning (`query-7-admin-user-delegation.sql` & `doc/db/admin_user_delegation.sql`)**:
  - Implemented database stored procedure `public.add_or_grant_portal_user(...)` allowing existing portal administrators to add new users, pre-provision profiles, or promote existing students by email or student ID.
  - Automatically tags users with `'portal'` in `project_tags` and assigns `is_portal_admin` role. If the user has not logged in yet, pre-provisions a profile record so that upon first sign-in via Google OAuth or email, their credentials and admin privileges are immediately active.
- **Frontend Admin Delegation Workspace ([`js/cms.js`](../js/cms.js))**:
  - Added **"+ Add User / Admin"** primary action button to the Admin Delegation toolbar.
  - Injected `#cmsUserModal` sub-modal allowing admins to input Email, Full Name, Student ID, Department, Batch, and Role Assignment (`Portal Administrator` vs `Portal Member`).
  - Added real-time search input (`cmsUserSearch`) supporting queries by student name, email, student ID, department, or batch.
  - Added role filter dropdown (`All Roles`, `Administrators Only`, `Members Only`).
  - Added an inline **Edit** button (`openEditUserModal`) to each user row in the delegation table, allowing fast editing of student profile metadata and role.
- **Service Worker & Visitor Changelog**:
  - Bumped cache version in [`service-worker.js`](../service-worker.js) to `ou1ts-portal-v2.6`.
  - Added `v2.6` entry to [`changes.json`](../changes.json).

### **Google Sheets Form Submissions Tracking Table & Admin View Switcher (Profile <-> CMS)**
- **Google Sheets Submissions Tracking (`portal_sheet_submissions` & `query-6-portal-sheet-submissions.sql`)**:
  - Implemented database table `public.portal_sheet_submissions` with deterministic primary key `sheet_row_id` (`sheet_row_2`, `sheet_row_14`) and `sheet_row_number INTEGER UNIQUE` corresponding to physical Google Sheet rows (`SHEET_ID = '1oQ5Mkavjm62UGZwNjM-52yvKppWZHfX-Qpq6jtEVIOY'`).
  - Added columns for submitter metadata (`submitter_name`, `submitter_email`, `student_id`, `department`, `batch`, `submitter_social`), project details (`project_title`, `project_link`, `project_type`, `portfolio_expertise`, `additional_details`), status tracking (`status` in `'pending'`, `'approved'`, `'already_added'`, `'rejected'`, `'feedback'`), and `mapped_resource_id TEXT REFERENCES public.portal_resources(id)`.
  - Added stored RPC function `public.approve_sheet_submission(...)` allowing portal administrators to atomically publish a pending submission into `public.portal_resources` and link its status in `public.portal_sheet_submissions`.
  - Pre-seeded all 13 existing Google Sheet entries, pre-mapping 11 verified submissions to existing catalog IDs (`tools-handgesture`, `courses-dsa1-robiul`, `portfolio-chatokjnr`, `portfolio-atikshahria`, `courses-cg-Arriesgado47`, `portfolio-#`, `capstone-research-archive`, `guidance-research-pub`, `courses-cg-4xrhd`, `courses-all-4xrhd`), identifying Row 12 as Feedback, and setting Row 14 (`Puzzle Solver` by Shalehin Ahmed Ornob) as `pending` for review.
- **Frontend Submissions & Approvals Engine ([`js/cms.js`](../js/cms.js))**:
  - Added live querying of `public.portal_sheet_submissions` with automatic fallback to direct Google Sheets API parsing and catalog cross-referencing.
  - Implemented category & status filter pills: `All Submissions`, `⚠️ Needs Approval` (unadded projects), `✅ Already on Website` (mapped projects), and `💬 Feedback` (feedback submissions).
  - Designed interactive cards showing row number, submitter identity, project link, and status badge.
  - Added 1-click **"Approve & Add to Website"** action that pre-fills the resource publishing modal with detected category, slug, submitter info, and destination URL.
  - Added **"View in Catalog"** button for verified items that navigates to the category page and smoothly scrolls to the element.
  - Updated `syncFromGoogleSheet()` with accurate 0-indexed column mapping to sync and upsert live Google Sheet responses.
- **Admin View Switcher (Profile View <-> CMS View)**:
  - In [`index.html`](../index.html), added `#cmsView` SPA view container and `.admin-view-switcher-container` in both `#profileView` and `#cmsView`.
  - In [`js/spa-controller.js`](../js/spa-controller.js), registered route `'cms': { viewId: 'cmsView', title: 'Admin CMS - oU1TS Portal', pageType: 'cms' }`.
  - Implemented segmented control toggle switcher: `[ 👤 Profile View ]  [ ⚡ CMS View ]` rendered dynamically at the top of both views for authenticated administrators.
  - Added `renderCmsView()` with role validation (denying non-admins) and rendering the inline CMS workspace.
  - In [`js/cms.js`](../js/cms.js), added `renderInlineWorkspace()` allowing full-page CMS operation inside `#cmsView` in addition to the modal popup.
  - In [`style.css`](../style.css), styled glassmorphic segmented control switcher bar, active tab glow, inline workspace container, and status badges.
- **Service Worker & Visitor Changelog**:
  - Bumped cache version in [`service-worker.js`](../service-worker.js) to `ou1ts-portal-v2.5`.
  - Added `v2.5` entry to [`changes.json`](../changes.json).

### **Expanded Featured Projects Pool (~30 Projects) & Mobile Semi-Transparent Gallery Arrows**
- **30-Project Multi-Category Rotating Pool**:
  - In [`js/data-renderer.js`](../js/data-renderer.js), updated `loadFeatured()` to include all 11 catalog sources (`materials.json`, `tools.json`, `capstones.json`, `community.json`, `guidance.json`, `official.json`, `portfolios.json`, `courses.json`, `inspirations.json`, `mentors.json`, and `talent.json`).
  - Extracted the top 3 submissions from each catalog, yielding a diverse 32-item pool (~30 projects) across all categories.
  - Implemented dynamic array shuffling (`sort(() => 0.5 - Math.random())`) so the rotating gallery cycles through all 32 projects in random order across page visits.
  - In `normalizeProjectItem()`, added title prioritization for mentors and talent candidates (`item.name || item.title`), formatted company/experience metadata, and supported custom text avatar fallbacks (`item.icon.type === 'text'`) for initials.
- **Mobile Semi-Transparent Frosted Glass Gallery Arrow Buttons**:
  - In [`style.css`](../style.css), removed `display: none;` on `.gallery-arrow` inside `@media (max-width: 768px)` and `@media (max-width: 480px)`.
  - Styled left and right navigation buttons with a semi-transparent frosted glass design (`background: rgba(15, 23, 42, 0.45)`, `border: 1px solid rgba(255, 255, 255, 0.16)`, `backdrop-filter: blur(8px)`).
  - Positioned `.gallery-prev` at `left: 6px` (4px on mobile) and `.gallery-next` at `right: 6px` (4px on mobile) with `touch-action: manipulation;` and `user-select: none;` for smooth mobile taps.
  - Adjusted `.featured-gallery-container` mobile padding to `2.8rem 1.6rem 0.85rem` to ensure clean separation between arrow buttons and slide cards.
- **Service Worker & Visitor Changelog**:
  - Bumped cache version in [`service-worker.js`](../service-worker.js) to `ou1ts-portal-v2.4`.
  - Added `v2.4` entry to [`changes.json`](../changes.json).

### **Portal CMS, Central Resources Database & Admin Role Delegation**
- **Central CMS & Database Schema (`query-5-portal-cms-resources-schema.sql` & `doc/db/portal_cms_schema.sql`)**:
  - Added `is_portal_admin` column to `public.profiles` with index and security comment for project-isolated administrator delegation.
  - Created `public.portal_resources` table (`id`, `category`, `title`, `description`, `url`, `copy_url`, `icon`, `links`, `tags`, `extra_data`, `status`, `sort_order`, `submitted_by`, timestamps) with RLS policies allowing public reading of approved resources and admin-only insertions/updates/deletions.
  - Created `public.portal_submissions` table for community link submissions and Google Form `FEEDBACK` records with status tracking (`pending`, `approved`, `rejected`, `resolved`).
  - Authored RPC functions:
    - `public.get_portal_users()`: Returns all profiles where `'portal' = ANY(project_tags)` for the Admin User Selector Modal.
    - `public.set_portal_admin(target_user_id, grant_admin)`: Validates caller has `is_portal_admin = true` and updates target user's admin privilege.
    - `public.approve_resource_submission(p_sub_id)`: Atomically slugifies, promotes, and publishes a community submission directly into `public.portal_resources`.
  - Migrated and seeded all 63 catalog records across 10 categories (`materials`, `tools`, `guidance`, `community`, `official`, `portfolios`, `courses`, `capstones`, `mentors`, `talent`) into `public.portal_resources`.
- **Frontend Management System Module ([`js/cms.js`](../js/cms.js))**:
  - Implemented glassmorphic CMS modal with 4 tabs:
    1. **Submissions & Approvals**: One-click approval/rejection with category auto-arrangement and live "Sync Google Form" sheet integration (`SHEET_ID = '1oQ5Mkavjm62UGZwNjM-52yvKppWZHfX-Qpq6jtEVIOY'`).
    2. **Content Manager**: Category filter, search, inline editor modal, status toggling, and direct catalog additions.
    3. **Feedback Inbox**: Dedicated triage inbox for Google Form student feedback and bug reports with resolution tags.
    4. **Admin User Selector**: Searchable student directory of users with Ecosystem Access to the portal (`'portal' = ANY(project_tags)`), featuring instant toggle switches for granting/revoking portal admin roles with self-demotion guards.
- **Dynamic Supabase Data Loading & Seamless JSON Fallback**:
  - In [`js/spa-controller.js`](../js/spa-controller.js), enhanced `loadAndRenderView(pageType)` to fetch approved catalog items from `public.portal_resources` first and dynamically normalize database records with `transformDbResources()`; falls back seamlessly to `json/*.json` if offline or unconfigured.
  - Preserved manual curation for institutional inspirations (`json/inspirations.json`) as requested.
  - In [`js/data-renderer.js`](../js/data-renderer.js), updated `loadFeatured()` to rank top initiatives dynamically across all categories joined with `resource_star_rankings`.
  - In [`js/auth.js`](../js/auth.js), added `isPortalAdmin` tracking, `Auth.isPortalAdmin()` check, and reactive UI updates.
  - In [`index.html`](../index.html), added Admin CMS launcher button to header and included `js/cms.js`.
  - In [`style.css`](../style.css), added glassmorphic modal styling, submission cards, tables, toggle switches, and responsive mobile layouts.
- **Service Worker & Visitor Changelog**:
  - Bumped cache version in [`service-worker.js`](../service-worker.js) to `ou1ts-portal-v2.3` and pre-cached `js/cms.js`.
  - Added `v2.3` entry to [`changes.json`](../changes.json).

### **Service Worker Same-Origin Fetch Filtering & Network Pipeline Stabilization**
- **Eliminated TypeError: Failed to convert value to 'Response'**:
  - In [`service-worker.js`](../service-worker.js), resolved issue where failed fetches and cache misses returned `undefined` to `event.respondWith()`, triggering cascade `net::ERR_FAILED` errors across local assets (`env-config.js`, `js/auth-modal.js`, `changes.json`, `json/*.json`).
  - Added strict same-origin filtering (`event.request.url.startsWith(self.location.origin)`), method filtering (`event.request.method === 'GET'`), and excluded WebSockets (`/ws`) and live-reload streams from interception.
  - Implemented safe fallback returning a proper HTTP 503 `Response` object instead of `undefined` when both network and cache are unavailable.
  - Added `self.skipWaiting()` and `self.clients.claim()` for immediate activation of the repaired service worker.
- **Service Worker & Visitor Changelog**:
  - Bumped cache version in [`service-worker.js`](../service-worker.js) to `ou1ts-portal-v2.2`.
  - Added `v2.2` entry to [`changes.json`](../changes.json).

### **Centralized Database Setup, Profile Integration and Star Ranking System**
- **Unified Central Database SQL Schema**:
  - Authored [`doc/query/query-4-central-db-portal-stars.sql`](query/query-4-central-db-portal-stars.sql) and mirrored in [`doc/db/portal_central_database_setup.sql`](db/portal_central_database_setup.sql).
  - Aligned schema with `ou1ts.github.io` central architecture: `public.profiles` (`student_id`, `email`, `full_name`, `department`, `batch`, `blood_group`, `social_*`, `project_tags`), partial unique index on real student IDs, trigger `handle_new_user()`, and RPC helper `add_project_tag(tag)`.
  - Configured `public.stars` table (`user_id`, `resource_type`, `resource_id`, `created_at`) with foreign key cascade to `public.profiles(id)`, unique constraint per user/resource, performance indexes, and strict Row Level Security (RLS) policies allowing public star count reads and authenticated owner-only star/unstar mutations.
  - Added real-time analytics view `public.resource_star_rankings` with category and global dense ranking, plus RPC helper functions `get_category_rankings()` and `get_user_star_metrics()`.
- **Comprehensive Step-by-Step Setup Guide**:
  - Authored [`doc/db/CENTRAL_DATABASE_SETUP_GUIDE.md`](db/CENTRAL_DATABASE_SETUP_GUIDE.md) detailing architecture, Supabase SQL Editor execution, Authentication URL redirects, Google OAuth provider setup, and verification checklists.
  - Added [`env-config.example.js`](../env-config.example.js) as a gitignored template for secure local client setup.
- **Frontend Profile & Stars Integration**:
  - In [`js/auth.js`](../js/auth.js), updated `setUser()` to fetch complete student profile fields (`full_name`, `department`, `batch`, `blood_group`, `project_tags`) and automatically invoke `supabase.rpc('add_project_tag', { tag: 'portal' })`.
  - In [`js/spa-controller.js`](../js/spa-controller.js), enriched `renderProfileView()` to display full student details, formatted joined dates, and active ecosystem project badges; enhanced offline fallback in `loadUserStarredList()`; and enabled stars functionality on `capstonesView`.
- **Service Worker & Visitor Changelog**:
  - Bumped cache version in [`service-worker.js`](../service-worker.js) to `ou1ts-portal-v2.1`.
  - Added `v2.1` entry to [`changes.json`](../changes.json).

### **100vh Floating Navigation Canvas Showcase & Seamless Scroll Reappearance**
- **100vh Fullscreen Focus Mode on Scroll Arrival**:
  - In [`style.css`](../style.css), added `.floating-nav-container.expanded-100vh` and `.floating-nav-canvas` styles utilizing `100vh` and modern `100dvh` dynamic viewport height units, accompanied by a `0.65s cubic-bezier(0.25, 1, 0.5, 1)` easing curve for container expansion.
  - Added `top 0.65s` and `left 0.65s` transitions to `.floating-bubble` anchors so category nodes fluidly glide into their expanded constellation across the enlarged canvas.
- **Adjacent Section Hiding & Reappearing Transitions**:
  - In [`style.css`](../style.css), configured smooth `0.55s` opacity and transform transitions on `.top-auth-bar`, `.featured-section`, `.about-clean-section`, and `footer`.
  - When in 100vh focus (`body.nav-focused-100vh`), upper elements glide up (`translateY(-24px)`) and fade out while lower elements glide down (`translateY(24px)`) and fade out, removing all surrounding visual clutter and putting full focus on all nodes together.
  - Added `.main-content` padding collapse under `body.nav-focused-100vh` with `transition: padding 0.55s ease` to ensure edge-to-edge vertical alignment.
- **Scroll Detection, Immediate Gesture Collapse & Slot Stability**:
  - In [`js/spa-controller.js`](../js/spa-controller.js), implemented `initNavScrollExpansion()`. When the user scrolls to `.floating-nav-container` (or idle auto-scroll arrives), it aligns flush to the top and smoothly expands to 100vh.
  - Attached immediate listeners to user scroll gestures (`wheel`, `touchmove`, arrow/navigation keys, non-programmatic `scroll`). The instant any user scroll action is initiated, the 100vh mode collapses immediately (0ms delay), smoothly pulling adjacent sections back into view without trapping the user.
  - Added cooldown guard and retained session `bubbleSlotOrder` across canvas height transitions to eliminate node shuffling or jumpiness.
  - In [`script.js`](../script.js), updated `initIdleAutoScroll()` target calculation to land flush with the top of the container.
- **Service Worker & Visitor Changelog**:
  - Bumped cache version in [`service-worker.js`](../service-worker.js) to `ou1ts-portal-v2.0`.
  - Added `v2.0` entry to [`changes.json`](../changes.json).

### **Desktop Top Auth Bar & Mobile Featured Gallery Margin Reduction & Mobile Bubble Padding Refinement**
- **Desktop Top Auth Bar Margin Reduction**:
  - In [`style.css`](../style.css), set `margin-top: -1rem` on `.top-auth-bar` for desktop viewports (`padding: 0.5rem 0 1rem`), bringing the header brand area snugly towards the top border while keeping mobile `margin-top: 0`.
- **Mobile Featured Section Margin-Top Reduction**:
  - In [`style.css`](../style.css), reduced `margin-top` for `.featured-section` inside `@media (max-width: 768px)` to `-0.85rem` (with `padding: 0.5rem 0 1rem`) and on small mobile (`≤ 480px`) to `margin-top: -1rem` (`padding-top: 0.25rem`), eliminating excessive vertical whitespace above the project gallery.
- **Mobile Bubble Padding Around Icon & Span Tags Refinement**:
  - In [`style.css`](../style.css), refined internal padding on `.floating-bubble` anchor tags to `2px !important` on tablets (`≤ 768px`) and `1px !important` on mobile (`≤ 480px`).
  - Set `padding: 0 !important; margin: 0 0 0.1rem 0 !important;` on `.floating-bubble i` and `padding: 0 2px !important; margin: 0 !important;` on `.floating-bubble span`, strictly preserving desktop icon size (`1.6rem`) and typography (`0.72rem`).
- **Service Worker & Visitor Changelog**:
  - Bumped cache version in [`service-worker.js`](../service-worker.js) to `ou1ts-portal-v1.9`.
  - Added `v1.9` entry to [`changes.json`](../changes.json).

### **Floating Navigation Scroll Persistence, Featured Gallery CLS Fix, Snapped Rank Pill & Counter**
- **Floating Navigation Canvas Scroll Persistence**:
  - In [`js/spa-controller.js`](../js/spa-controller.js), added `lastWindowWidth` check inside `window.resize` debounce listener. Viewport height fluctuations caused by mobile address bars showing/hiding during scroll no longer fire bubble repositioning.
  - Implemented session-level slot randomization caching (`bubbleSlotOrder` and `bubbleJitters`). Every page refresh generates a fresh randomized distribution of links, while scrolling, resizing within the same column count, and returning from subviews retain the assigned positions without re-randomizing or jumping.
- **Eliminated Featured Gallery Layout Shifting (CLS)**:
  - In [`style.css`](../style.css), converted `.gallery-track` to CSS Grid stacking (`grid-template-columns: 1fr; grid-template-rows: 1fr;`) with all slides sharing `grid-column: 1; grid-row: 1`. This naturally locks the track height to the maximum content height across slides and prevents page jumping as slides rotate.
  - Added explicit line clamping and `min-height: 2.65rem` (`2.05rem` on mobile) to `.gallery-desc` to ensure consistent description vertical rhythm.
- **Border-Snapped Bottom-Right Rank Label**:
  - In [`index.html`](../index.html), added `.gallery-corner-rank` (`#galleryCornerRank`) inside `.featured-gallery-container`.
  - In [`style.css`](../style.css), positioned `.gallery-corner-rank` snapped flush to the bottom-right border (`bottom: 0; right: 0; border-top-left-radius: 14px; border-bottom-right-radius: 24px;`).
  - In [`js/data-renderer.js`](../js/data-renderer.js), removed the old rank pill from the project card info area and dynamically update `#galleryRankText` whenever the active slide changes.
- **Modern Numerical Slide Counter**:
  - In [`index.html`](../index.html), converted `#galleryIndicators` to `.gallery-counter` displaying `01 / 05` format.
  - In [`js/data-renderer.js`](../js/data-renderer.js), removed dot generation loops and updated the numerical counter elements (`galleryCounterCurrent`, `galleryCounterTotal`) on slide change.
  - In [`style.css`](../style.css), styled `.gallery-counter` with a compact pill badge, tabular numbers, and glassmorphism styling.
- **Service Worker & Visitor Changelog**:
  - Bumped cache version in [`service-worker.js`](../service-worker.js) to `ou1ts-portal-v1.8`.
  - Added `v1.8` entry to [`changes.json`](../changes.json).

### **Reduced Vertical Gaps Between Core Home Hub Sections**
- **Removed Extraneous Line Breaks**:
  - In [`index.html`](../index.html), removed `<br><br>` placed directly between `.floating-nav-container` (Explore Hub Resources) and `.about-clean-section` (`#about`).
- **Compact Section Vertical Margins & Padding**:
  - In [`style.css`](../style.css), decreased `.featured-section` vertical padding from `2.5rem 0` to `1rem 0`.
  - Decreased `.floating-nav-container` vertical margin from `3rem 0` to `1rem 0` (desktop), `0.75rem 0` on tablets (`≤ 768px`), and `0.5rem 0` on mobile (`≤ 480px`).
  - Decreased `.about-clean-section` vertical padding from `2rem 0` to `0.75rem 0`, and tightened `.about-socials-row` vertical margin from `1.25rem auto 1.5rem` to `0.5rem auto 1rem`.
- **Version Bump & Visitor Changelog**:
  - Bumped cache version in [`service-worker.js`](../service-worker.js) to `ou1ts-portal-v1.7`.
  - Added `v1.7` entry to [`changes.json`](../changes.json) detailing the layout gap optimization.

# 20.09.26

### **Gallery Card Restructure, Mobile Changelog Button Visibility & Bubble Padding**
- **Gallery Card Restructured (Category Pill Under Media, Rank Pill Above Title)**:
  - In [`js/data-renderer.js`](../js/data-renderer.js), placed `.gallery-category-pill` directly below the media container within `.gallery-media-col` (left column).
  - Placed `.gallery-rank-pill` directly above the project title `.gallery-title` within `.gallery-info` (right column).
  - Removed wrapper `.gallery-tags` and intermediate `.gallery-bottom-row` containers, keeping the HTML clean and layout handled via CSS.
- **Gallery Rank Pill Fits Content Width**:
  - Set `width: fit-content` on `.gallery-rank-pill` in [`style.css`](../style.css) for both base and mobile styles, preventing it from stretching across the entire width of `.gallery-info`.
- **Excluded `featured.json` from Dynamic Featured Gallery Loader**:
  - In [`js/data-renderer.js`](../js/data-renderer.js), removed `featured.json` from the `PROJECT_LISTS` randomizer array so the gallery draws exclusively from actual categorized section project lists (`materials`, `tools`, `capstones`, `community`, `guidance`, `official`, `portfolios`, `inspirations`, `courses`).
- **Mobile Changelog Button Hidden on Desktop**:
  - Added `@media (min-width: 769px) { #mobile-changelog-btn { display: none !important; } }` in [`style.css`](../style.css) — the top-bar button is now mobile-only; desktop continues to use the floating bottom-left changelog pill.
- **Floating Bubble Padding Eliminated on Mobile Screens**:
  - Reduced `.floating-bubble` padding to `0 !important` on tablet (`≤ 768px`) and mobile (`≤ 480px`) in [`style.css`](../style.css), with icon bottom margin snugged to `0.2rem`/`0.15rem`, ensuring maximum internal content fit inside circular buttons without altering icon (`1.6rem`) or font (`0.72rem`) sizes.

### **Mobile Bubble Desktop Font & Icon Scale Retention & Top Bar Icon-Only Button**
- **Desktop Typography and Icon Scale Preserved for Mobile Bubbles** (revised):
  - Retained full desktop icon size (`1.6rem`), bubble dimensions (`110px`), and typography (`0.72rem`, `font-weight: 600`) on mobile — no size or font reduction at all.
  - Only reduced internal padding to `0.35rem` on tablet (`≤ 768px`) and `0.25rem` on mobile (`≤ 480px`), letting more bubbles fit without visually shrinking them.
  - Removed previous `width: 90px/86px !important` and `height` overrides from mobile media queries in [`style.css`](../style.css).
- **Changelog Text Hidden at Correct Breakpoint**:
  - Moved `.top-changelog-btn` mobile icon-only treatment from `max-width: 600px` to the main `max-width: 768px` mobile auth block in [`style.css`](../style.css) so it triggers consistently with all other mobile top bar hide rules.
  - Used `:not(.changelog-badge-pill)` selector to hide only the "Changelog" label text while retaining the version badge pill.
  - Removed the now-redundant duplicate `@media (max-width: 600px)` block for `.top-changelog-btn` at the bottom of [`style.css`](../style.css).

### **Footer Links Placement Below All SPA Subviews**
- **Persistent Bottom Placement for Footer Links**:
  - Relocated `.about-footer-links` (Source Code and Documentation pill buttons) from its previous position above `#GROUP_SPA_SECTIONS` down to the bottom of the main container right after `#GROUP_SPA_SECTIONS` in [`index.html`](../index.html).
  - Eliminates the previous layout bug where footer links were displaying at the top of category subview pages (Materials, Tools, Guidance, Community, Courses, Portfolios, Official, Inspirations, Profile, Capstones, Mentors, Talent).
  - Enhanced bottom margin in [`style.css`](../style.css) (`margin: 2.5rem 0 3.5rem;`) for comfortable clearance above desktop changelog trigger pills and mobile viewports.
  - Bumped Service Worker cache version to `ou1ts-portal-v1.5` in [`service-worker.js`](../service-worker.js) and updated [`changes.json`](../changes.json).

### **Mobile Bubble Padding Reduction, Inter-Link Gap Expansion & Socials Centering**
- **Mobile Floating Bubbles Snug Fit & Spacing Expansion**:
  - Re-ordered CSS declarations in [`style.css`](../style.css) so responsive rules strictly take precedence over the base `.floating-bubble` rules.
  - Sized bubbles down to `50px` on mobile (`<= 480px`) and `60px` on tablet (`<= 768px`) with `padding: 1px !important;`, stripping away excessive internal padding around the icon and typography so elements sit comfortably and snugly within the circular borders.
  - In [`js/spa-controller.js`](../js/spa-controller.js), increased the visual safety gap from `8px` to `18px` on mobile (`22px` on tablet) and increased strict geometric separation (`absoluteMinDist`), allowing generous negative space between circular links and preventing crowding.
- **Centered About Socials Row**:
  - Centered `.about-socials-row` horizontally with `justify-content: center; margin: 1.25rem auto 1.5rem;` in [`style.css`](../style.css) and cleaned up empty inline styles in [`index.html`](../index.html).
- **Mobile Changelog Button Streamlining**:
  - Hid `.changelog-badge-pill` on mobile viewports (`max-width: 600px`) via `display: none !important;` in [`style.css`](../style.css), retaining the icon and clean label without version clutter.
  - Bumped Service Worker cache to `ou1ts-portal-v1.4` in [`service-worker.js`](../service-worker.js) and updated [`changes.json`](../changes.json).

### **Featured Projects Multi-Category Top 3 Randomizer & Vertical Tags Layout**
- **Multi-Category Top 3 Randomizer**:
  - Upgraded `loadFeatured()` in [`js/data-renderer.js`](../js/data-renderer.js) to query all 10 curated project datasets in `json/` (`materials.json`, `tools.json`, `capstones.json`, `community.json`, `guidance.json`, `official.json`, `portfolios.json`, `inspirations.json`, `courses.json`, `featured.json`).
  - Automatically isolates the top 3 projects from each dataset, picks one at random per category, and shuffles the full pool so every page visit yields a diverse, unpredictable showcase of 8–10 high-ranking student resources instead of a static top 3.
  - Added robust data normalization with image fallback handling (`onerror`) and dynamic rank pills.
- **Vertical Tags Arrangement Under Thumbnail**:
  - Restructured the project gallery slide in [`js/data-renderer.js`](../js/data-renderer.js) by introducing `.gallery-media-col` holding `.gallery-media` on top and `.gallery-tags` directly underneath.
  - Arranged `.gallery-rank-pill` and `.gallery-category-pill` in a clean vertical stack (`flex-direction: column; align-items: center;`) inside `.gallery-tags` in [`style.css`](../style.css).
  - In mobile layout (`@media (max-width: 768px)`), removed absolute bottom-right positioning so tags remain neatly aligned right under the 85px thumbnail without cluttering or overlapping project descriptions.

### **About & Socials Section Merge, Header Changelog Pill & Sidebar Deprecation**
- **Unified Clean About & Socials Section**:
  - Merged `#about` and `#platforms` into a single, cohesive `.about-clean-section` in [`index.html`](../index.html).
  - Placed responsive community social icon links (`.about-socials-row`) directly beneath the `<h2 class="category-title">About This Portal</h2>` header.
  - Shortened the portal description copy to a clean, focused summary and stripped out legacy opaque card styling, borders, and box-shadows so the section rests seamlessly on the global background.
  - Replaced legacy `.hero-badge` footer links with modern glassmorphic pill buttons (`.about-footer-links` and `.about-footer-link`) matching the design system of `ou1ts.github.io`.
- **Sidebar Deprecation & Top Header Changelog Relocation**:
  - Commented out the legacy `<nav class="sidebar" id="sidebar">` and mobile toggle button in [`index.html`](../index.html) to transition to an unencumbered single-page interface.
  - Relocated the visitor Changelog trigger button (`#mobile-changelog-btn` / `.top-changelog-btn`) directly into the top header auth bar (`.auth-section`), ensuring immediate access on both mobile and desktop.
  - Bumped Service Worker cache version to `ou1ts-portal-v1.2` in [`service-worker.js`](../service-worker.js) and synchronized [`changes.json`](../changes.json).

### **Subtitles Relocation, Typewriter Animation, Mobile Gallery Grid & Visitor Changelog Architecture**
- **Brand Subtitle Typewriter Effect**:
  - Relocated portal subtitles (`Projects for and by the students of UITS.` and `Resources | Guides | References`) directly beneath the top-left site brand logo inside `.brand-wrapper` in [`index.html`](../index.html).
  - Engineered `startBrandTypewriter()` in [`script.js`](../script.js) with a blinking cyan cursor (`@keyframes cursorBlink`) in [`style.css`](../style.css). It loads character-by-character from left to right at ~38ms intervals right after the preloader completes its docking animation.
  - Upon typing completion, gracefully removes the typing cursor (`.done-typing`) and reveals the sub-tags with vertical translation and smooth opacity (`.visible`).
  - Purged redundant `<section class="hero-section">` from [`index.html`](../index.html).
- **Featured Projects Mobile Layout & Integrated Badges**:
  - Replaced the external `.featured-header-row` with an integrated `.gallery-corner-label` positioned inside `.featured-gallery-container` in [`index.html`](../index.html).
  - Aligned `.gallery-live-badge` strictly to the right using `justify-content: space-between` across desktop and mobile in [`style.css`](../style.css).
  - Redesigned mobile layout (`@media (max-width: 768px)`):
    - Substantially reduced section height (min-height reduced to 175px).
    - Positioned `.gallery-media` thumbnail on the left with `.gallery-action` (`.gallery-visit-btn`) stacked directly below it.
    - Positioned `.gallery-title` and `.gallery-desc` in the right-hand info column.
    - Positioned `.gallery-tags` (`.gallery-rank-pill` and `.gallery-category-pill`) securely in the bottom-right corner of the container.
- **Floating Bubbles Mobile Optimization**:
  - Resized `.floating-bubble` on mobile viewports from 82px/72px down to 68px/58px with compact padding (`padding: 0.15rem–0.22rem`) and scaled icons/typography.
  - Reduced `.floating-nav-canvas` height from 880px to 450px–520px and updated cell stratification in [`js/spa-controller.js`](../js/spa-controller.js) to 3 columns on mobile, enabling all 11 category links to fit cleanly within a single viewport without vertical overflow.
- **7-Second Single-Execution Inactivity Auto-Scroll**:
  - Upgraded idle inactivity detection in [`script.js`](../script.js) to trigger after exactly 7 seconds of inactivity.
  - Ensured auto-scroll glides downward with silky smooth `easeInOutCubic` physics over 1400ms.
  - Unregistered all event listeners upon triggering so that auto-scroll runs only once per visit and never interrupts returning navigation.
- **Visitor Changelog Architecture & Service Worker Version Detection**:
  - Modeled after `b1t-Acad`, added [`changes.json`](../changes.json) tracking version release notes, categories, and tags.
  - Created [`js/changelog-modal.js`](../js/changelog-modal.js) which detects updates by comparing `service-worker.js` `CACHE_NAME` (`ou1ts-portal-v1.1`) and `changes.json` `currentVersion` against `localStorage`.
  - Added desktop floating trigger pill button (`#desktop-changelog-btn`) at bottom-left and mobile navigation drawer item (`#mobile-changelog-btn`).
  - Bumped cache version in [`service-worker.js`](../service-worker.js) to `ou1ts-portal-v1.1` and cached new changelog assets.
- **Repository Guidelines & Documentation**:
  - Aligned [`AGENTS.md`](../AGENTS.md) with the portal repository file structure (`style.css`, `script.js`, `js/`, `changes.json`, `doc/DOCUMENTATION.md`).
  - Updated [`README.md`](../README.md) and [`doc/DOCUMENTATION.md`](DOCUMENTATION.md) to reflect new features and architecture.

---

# 19.09.26

### **Centered Preloader Docking, Dynamic Gallery Showcase & Playful Floating Bubble Canvas**
- **Centered Intro Preloader**:
  - Created `#portalPreloader` in [`index.html`](../index.html) that displays centered on load and calculates exact pixel trajectory (`deltaX`, `deltaY`, `targetScale`) to glide directly into the top-left `#siteBrand` position.
- **Featured Projects Changing Gallery**:
  - Created rotating gallery showcase in [`js/data-renderer.js`](../js/data-renderer.js) randomly selecting top 3 projects from curated JSON datasets and database rankings with auto-rotation, arrow controls, and pagination indicators.
- **Playful Floating Bubbles Navigation**:
  - Replaced static category card grid with an organic floating bubble canvas (`#floatingCanvas`) in [`index.html`](../index.html).
- **Supabase Authentication Centralization**:
  - Created unified auth modal, centralized config in `env-config.js` and `js/supabase-config.js`, and secured client access.
