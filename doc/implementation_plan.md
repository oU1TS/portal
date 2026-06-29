# Website Restructure: UIU LinkSphere Style

Restructure the oU1TS Portal to match the structural layout of [UIU LinkSphere](https://uiulinks.vercel.app/) while preserving the existing dark theme styling.

## Reference Design Analysis

Based on the uploaded screenshots, UIU LinkSphere features:

![Homepage Reference](.gemini/antigravity/brain/789d6786-5582-4a31-a414-1e8bc397e462/uploaded_media_0_1769531997606.png)

![Category Page Reference](.gemini/antigravity/brain/789d6786-5582-4a31-a414-1e8bc397e462/uploaded_media_1_1769531997606.jpg)

**Homepage Structure:**
- Header with logo and navigation
- Hero section with tagline and description
- Central "Submit Resource" button
- Category cards grid linking to separate pages

**Category Page Structure:**
- Back button with category title
- "Add Link" submit button
- Numbered list of resources with visit/copy buttons

---

## Proposed Changes

### Homepage ([index.html](ou1ts.portal/index.html))

#### [MODIFY] Homepage Structure

1. **Hero Section** - Replace current layout with:
   - Central portal title with animated tagline
   - Description paragraph
   - "Submit Resource" button (links to Google Form placeholder)

2. **Category Cards Grid** - Clickable cards matching reference:
   | Card | Subtitle | Link |
   |------|----------|------|
   | Official UITS | Portals & Notices | `official.html` |
   | Materials | Drive & Other links | `materials.html` |
   | Tools | Projects | `tools.html` |
   | Community | Groups & Social | `community.html` |
   | Portfolios | Showcases | `portfolios.html` |
   | Course Repos | GitHub Repositories | `courses.html` |

3. **Featured Projects Marquee** - Horizontal scrolling section:
   - Auto-scrolls right to left
   - Clickable project cards
   - Shows project logo/image and name

---

### Category Pages

Each category page includes: Back button, category header with icon, "+ Add Link" button (Google Form), numbered project list.

| Page | Title | Content |
|------|-------|------|
| [official.html](ou1ts.portal/official.html) | Official UITS | University portals & notices |
| [materials.html](ou1ts.portal/materials.html) | Materials | Study resources & drives |
| [tools.html](ou1ts.portal/tools.html) | Tools | Project tools & utilities |
| [community.html](ou1ts.portal/community.html) | Community | Social links & groups |
| [portfolios.html](ou1ts.portal/portfolios.html) | Portfolios | Student showcases |
| [courses.html](ou1ts.portal/courses.html) | Course Repos | **Dropdown menus per course** with GitHub repo links |

> [!NOTE]
> All categories will be populated with **demo content** that can be replaced later.

---

### Styles

#### [MODIFY] [style.css](ou1ts.portal/style.css)

Add new styles while preserving existing theme:
- `.hero-section` - Centered hero layout
- `.category-cards-grid` - Grid layout for category cards
- `.category-card` - Individual card styling
- `.marquee-container` - Horizontal scrolling wrapper
- `.marquee-track` - Animated scrolling track
- `.marquee-item` - Individual featured project in marquee
- `.category-page` - Category page layout
- `.project-list` - Numbered project list
- `.project-item` - Individual project row

---

## User Review Required

> [!IMPORTANT]
> **Google Form Link Required**
> Please provide the Google Form URL for the "Submit Resource" button. For now, I'll use a placeholder `#submit` link.

> [!NOTE]
> The existing theme colors (dark blue background, blue/green gradients) will be preserved. Only structural changes are being made.

---

## Verification Plan

### Manual Verification
1. **Homepage Layout** - Open `index.html` in browser and verify:
   - Hero section displays correctly
   - Category cards are clickable and link to correct pages
   - Featured projects marquee scrolls right-to-left
   - About and Socials sections remain intact

2. **Category Pages** - Navigate to each category page and verify:
   - Back button works
   - Project list displays correctly
   - Submit button is visible

3. **Mobile Responsiveness** - Test on mobile viewport:
   - Category cards stack properly
   - Marquee is touch-scrollable
   - Navigation works correctly

### Browser Testing
I will use the browser tool to:
- Navigate through all pages
- Verify links work correctly
- Test hover states and animations
- Capture screenshots of the final result
