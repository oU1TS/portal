<!--
Tags: [portal, release-notes, changelog, history, preloader, typewriter, gallery, auto-scroll, service-worker]
-->

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
