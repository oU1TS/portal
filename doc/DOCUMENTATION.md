# oU1TS Portal Documentation

A centralized hub for UITS students to access resources, projects, and community links. Built with vanilla HTML, CSS, and JavaScript for maximum simplicity and portability.

This project is an Academic Resources Portal called "oU1TS Portal" designed to serve as a centralized hub for UITS students to discover and access academic resources, projects, and community platforms. 
- The portal's primary purpose is to make it easy for students to find study materials, useful tools, course repositories, guidance tutorials, and social groups all in one place through an organized category-based navigation system.
- Students can actively contribute by submitting their own resources via Google Forms, and contributors are recognized in a dedicated "Contributors" section, fostering a culture of collaboration and peer support.
- By integrating authentication (via Supabase with Google OAuth and email options), featured project showcases, and links to various social platforms (Facebook, Telegram, Discord, Reddit, GitHub), the project builds community value and encourages students to participate in creating a productive, student-centered online ecosystem that helps them navigate university life more effectively while showcasing student-made projects and portfolios.

---

## Table of Contents
- [Project Structure](#project-structure)
- [Pages Overview](#pages-overview)
- [Authentication & Starring System](#authentication--starring-system)
- [Supabase Setup Guide](#supabase-setup-guide)
- [Customization Guide](#customization)
- [Google Sheets Integration](#google-sheets-setup)
- [Changelog](#changelog)

---

## Project Structure

```
ou1ts.portal/
├── index.html          # Homepage with hero, categories, featured marquee (dynamic marquee)
├── official.html       # Official UITS - Portals & Notices (dynamic list)
├── materials.html      # Materials - Drive & Other links (dynamic list)
├── tools.html          # Tools - Projects (dynamic list)
├── community.html      # Community - Groups & Social (dynamic list)
├── portfolios.html     # Portfolios - Showcases (dynamic list)
├── courses.html        # Course Repositories - GitHub repos per course (dynamic lists)
├── guidance.html       # Guidance - Tips & Tutorials (dynamic list)
├── contributions.html  # Contributors - Dynamic page with Google Sheets integration
├── style.css           # Main stylesheet (shared across all pages)
├── script.js           # JavaScript functionality (sidebar, mobile menu)
├── inspirations.html   # Inspirations - Portals from other universities (dynamic lists)
├── json/               # Dynamic data source folder
│   ├── community.json  # Data for community.html
│   ├── courses.json    # Data for courses.html
│   ├── featured.json   # Data for index.html featured marquee
│   ├── guidance.json   # Data for guidance.html
│   ├── inspirations.json # Data for inspirations.html
│   ├── materials.json  # Data for materials.html
│   ├── official.json   # Data for official.html
│   ├── portfolios.json # Data for portfolios.html
│   └── tools.json      # Data for tools.html
├── js/                 # JavaScript modules
│   ├── supabase-config.js  # Supabase client configuration
│   ├── auth-modal.js       # Reusable Auth Modal HTML injection
│   ├── auth.js             # Authentication logic (login, register, logout)
│   ├── stars.js            # Resource starring and ranking logic
│   └── data-renderer.js    # Universal JSON data fetching and rendering engine
├── portfolio-icon/     # Icons and assets for portfolio section
└── doc/
    └── DOCUMENTATION.md    # This documentation file
```

---

## Pages Overview

### Homepage (`index.html`)

The main landing page with the following sections:

| Section | Description |
|---------|-------------|
| **Hero Section** | Portal title "oU1TS Portal", tagline, and "Submit Resource" button linking to Google Form |
| **Featured Projects Marquee** | Horizontal auto-scrolling showcase of highlighted student projects |
| **Category Cards** | 9 clickable cards linking to category pages (Materials, Tools, Community, Course Repos, Portfolios, Official UITS, Guidance, Inspirations, Contributors) |
| **About Section** | Description of the oU1TS initiative |
| **Socials Section** | Links to Facebook, Telegram, Discord, GitHub, Reddit |
| **App Download** | QR code for the mobile app version (v2.0) |

**Sidebar Navigation:**
- Collapsible sidebar for mobile devices
- Quick links to all sections
- "Open in App" button

---

### Category Pages

Each category page follows a consistent structure:

```html
<div class="category-page">
    <header class="category-header">
        <!-- Back button, icon, title, and "Add Link" button -->
    </header>
    <div class="project-list">
        <!-- List of .project-item elements -->
    </div>
</div>
```

| Page | Category | Icon | Description |
|------|----------|------|-------------|
| `official.html` | Official UITS | 🌐 Globe | University portals (Student Portal, Library, Notice Board) |
| `materials.html` | Materials | 🎓 Graduation Cap | Google Drive links, study resources, notes |
| `tools.html` | Tools | 📖 Book Open | Student-made tools and utilities |
| `community.html` | Community | 🔗 Share Nodes | Social groups, Facebook groups, Discord servers |
| `portfolios.html` | Portfolios | 👤 User | Student portfolio showcases with **Core Expertise Tags** |
| `courses.html` | Course Repos | 📦 GitHub | GitHub repositories organized by course with dropdown menus |
| `guidance.html` | Guidance | 💡 Lightbulb | Tips, tutorials, and helpful guides |
| `inspirations.html` | Inspirations | ✨ Magic Wand | Portals from other universities (UIU, DIU) |

**Common Features:**
- Back button → returns to `index.html`
- "+ ADD LINK" button → opens Google Form for submissions
- Numbered project items with visit/copy buttons
- Consistent dark theme styling
- **Star button** for each resource (requires login)
- **Login/Logout button** in header
- Resources sorted by star count (most starred first)

> **Note:** `courses.html` uses **per-dropdown ranking** — resources are sorted by stars only within their respective course section, not across the entire page.

---

### Contributors Page (`contributions.html`)

A dynamic page that fetches contributor data from Google Sheets in real-time.

**Features:**
| Feature | Description |
|---------|-------------|
| **Dynamic Data Fetching** | Pulls data from Google Sheets on page load |
| **Contributor Cards** | Displays name, email, department, batch, and resource count |
| **Grouped by Name** | Multiple submissions by the same person are grouped |
| **Sorted by Contributions** | Top contributors appear first |
| **Clickable Cards** | Opens modal popup with resource details |
| **Modal Popup** | Shows all resources submitted by a contributor with title, type, and link |
| **Loading State** | Spinner displayed while fetching data |
| **Empty State** | Shown when no contributions exist |
| **Error State** | Displayed if fetch fails |
| **Recent Submissions** | Sliding panel showing the 10 most recent community contributions |

**Modal Features:**
- Click card to open
- Click ✕, overlay, or press Escape to close
- **Recent Submissions Panel:**
  - Click "Recent Submissions" bell button to open
  - Displays 10 most recent submissions in reverse chronological order
  - Each item shows contributor name, resource title, and type
  - **Clickable Type Badges**: Redirects to the corresponding category page
- **Contact Information Section:**
  - Email (clickable mailto: link with envelope icon)
  - Social Links (clickable if URL, with link icon)
  - Fallback message if no contact info provided
- **Resources Section:**
  - Project Title
  - Project Type (as clickable badge linking to corresponding category page)
  - Project Link (clickable, opens in new tab)

---

### Progressive Web App (PWA)

The portal is a fully functional Progressive Web App, allowing it to be installed on mobile and desktop devices.

| Feature | Description |
|---------|-------------|
| **Installable** | Users can "Add to Home Screen" on Android/iOS via the browser menu |
| **Offline Support** | Core assets are cached for offline access |
| **Notifications** | Browser notifications for new resource submissions on the Contributors page |
| **Theme Sync** | The PWA uses the `#1a1a2e` theme color to match the site's dark mode |
| **Custom Icon** | High-quality portal icon used for app shortcuts and splash screen |

---

## Authentication & Starring System

The portal includes a user authentication system with Supabase that allows students to:
- Register with Student ID (10+ digits), email, and password
- Login/logout across all pages
- Complete Student ID after Google OAuth (mandatory)
- Star resources to show appreciation
- See resources ranked by popularity (star count)

### How It Works

| Component | Description |
|-----------|-------------|
| **Supabase Auth** | Handles user registration, login, and session management |
| **Profiles Table** | Stores user Student ID and email |
| **Stars Table** | Tracks which users starred which resources |
| **Row Level Security** | Ensures users can only modify their own data |

### Authentication Flow

1. User clicks **Login** button (top-right on any page)
2. Modal appears with authentication options:
   - **Google OAuth** (recommended) - One-click sign in, no email verification needed
   - **Email/Password** - Traditional registration with Student ID
3. **Google Login:** Click "Continue with Google" → Select Google account
4. **Required Step:** User must enter Student ID (10+ digits) in the prompt
  - If they do not want to add it, they can choose **Logout**
5. **Register:** Student ID (10+ digits) + Email + Password
6. **Login:** Email + Password
7. On success, user info displayed in header
8. Session persists across pages via Supabase

### Google OAuth (Recommended)

Google OAuth bypasses Supabase's email rate limits and provides a faster login experience.
After OAuth sign-in, users must add their Student ID to complete their profile.

| Benefit | Description |
|---------|-------------|
| **No Email Limits** | No verification emails needed |
| **One-Click Login** | Users sign in with existing Google account |
| **Faster UX** | No password to remember |
| **Secure** | OAuth 2.0 industry standard |

### Starring System

| Feature | Description |
|---------|-------------|
| **Star Button** | Appears on each resource item |
| **Disabled State** | Shown when not logged in (tooltip: "Login to star") |
| **Active State** | Yellow filled star when user has starred |
| **Star Count** | Number displayed next to star icon |
| **Auto-Sort** | Resources sorted by star count (descending) |
| **Per-Dropdown Sort** | `courses.html` sorts within each dropdown section independently |
| **Optimistic UI** | Instant visual feedback, reverts on error |

### Files Overview

| File / Folder | Purpose |
|------|--------|
| `js/supabase-config.js` | Supabase client initialization with project URL and anon key |
| `js/auth-modal.js` | Auth Modal module: reusable script to dynamically inject the auth modal HTML template |
| `js/auth.js` | Auth module: register, login, logout, session management, UI updates |
| `js/stars.js` | Stars module: toggle stars, load counts, sort resources |
| `js/data-renderer.js` | Universal data renderer: dynamically fetches JSON files and builds DOM components for lists, dropdowns, and featured marquee tracks |
| `json/` | Folder containing structured data (.json files) representing all items/resources on category pages and index marquee |
| `courses.html` (inline) | `CoursesStars` module: per-dropdown star sorting for course repositories |

### Resource ID Format

Each resource has a unique `data-resource-id` attribute:
- Format: `{page}-{identifier}`
- Examples: `community-facebook`, `courses-spl-b1tranger`, `tools-handgesture`

---

## Supabase Setup Guide

### 1. Create Supabase Account & Project

1. Go to **https://supabase.com** → Click **"Start your project"**
2. Sign up with **GitHub** (recommended)
3. Click **"New Project"** and fill:
   - **Name:** `ou1ts-portal`
   - **Database Password:** (save securely!)
   - **Region:** Singapore (closest to Bangladesh)
4. Wait 2-3 minutes for project creation

### 2. Get API Keys

1. Go to **Settings** (gear icon) → **API**
2. Copy:
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon public key:** `eyJhbGc...`

### 3. Update Config File

Edit `js/supabase-config.js`:

```javascript
const SUPABASE_URL = 'https://YOUR-PROJECT-ID.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

### 4. Create Database Tables

In Supabase SQL Editor, run:

```sql
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  student_id TEXT,  -- Nullable to support OAuth users
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create stars table
CREATE TABLE public.stars (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, resource_type, resource_id)
);

-- Create index for faster queries
CREATE INDEX idx_stars_resource ON public.stars(resource_type, resource_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stars ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
  
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- Stars policies  
CREATE POLICY "Anyone can view star counts" ON public.stars
  FOR SELECT USING (true);
  
CREATE POLICY "Authenticated users can star" ON public.stars
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can unstar own stars" ON public.stars
  FOR DELETE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, student_id, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'student_id', 'OAUTH_USER'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 5. Configure Authentication URLs

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL:** `https://ouits-res.netlify.app`
3. Add to **Redirect URLs:** `https://ouits-res.netlify.app`

### 6. Configure Google OAuth

#### Step 1: Google Cloud Console
1. Go to [console.cloud.google.com](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth client ID**
5. Select **Web application**
6. Add **Authorized redirect URI:**
   ```
   https://YOUR-PROJECT-ID.supabase.co/auth/v1/callback
   ```
7. Copy the **Client ID** and **Client Secret**

#### Step 2: Supabase Configuration
1. Go to **Authentication → Providers → Google**
2. Toggle **Enable** on
3. Paste **Client ID** and **Client Secret**
4. Save

### 7. Troubleshooting OAuth Login Issues

If Google OAuth fails with **"Database error saving new user"**, run the fix scripts in order:

#### Script 1: Core OAuth Fix (`supabase_fix.sql`)
Fixes the trigger to handle OAuth users correctly:
```sql
-- Run this first - updates trigger, makes student_id nullable
ALTER TABLE public.profiles ALTER COLUMN student_id DROP NOT NULL;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
-- ... (see supabase_fix.sql for complete script)
```

#### Script 2: Constraint Fix (`supabase_constraint_fix.sql`)
Fixes "duplicate key value violates unique constraint" error:
```sql
-- Run this if you see duplicate OAUTH_USER errors
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_student_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_student_id_unique
  ON public.profiles (student_id)
  WHERE student_id IS NOT NULL AND student_id <> 'OAUTH_USER';
```

**Why?** Multiple OAuth users can't all have `student_id = 'OAUTH_USER'` with a UNIQUE constraint. The partial index allows duplicates of 'OAUTH_USER' while keeping real student IDs unique.

### Database Schema

```
profiles
├── id (UUID, PK, FK → auth.users)
├── student_id (TEXT, UNIQUE)
├── email (TEXT)
└── created_at (TIMESTAMPTZ)

stars
├── id (SERIAL, PK)
├── user_id (UUID, FK → profiles)
├── resource_type (TEXT)  -- e.g., 'community', 'tools'
├── resource_id (TEXT)    -- e.g., 'community-facebook'
├── created_at (TIMESTAMPTZ)
└── UNIQUE(user_id, resource_type, resource_id)
```

---

## Customization

### Adding New Resources Manually

1. Open the corresponding category page (e.g., `materials.html`)
2. Locate the `.project-list` div
3. Add a new `.project-item` following this structure:

```html
<div class="project-item" data-resource-id="category-unique-id">
    <span class="project-number">01</span>
    <div class="project-icon" style="background: linear-gradient(135deg, #e3f2fd, #bbdefb);">
        <i class="fa-solid fa-icon-name" style="color: #1976d2;"></i>
    </div>
    <div class="project-info">
        <h3>Resource Title</h3>
        <p>https://example.com/</p>
        <div class="expertise-tags">
            <span class="expertise-tag">Core Expertise</span>
        </div>
    </div>
    <div class="project-actions">
        <button class="star-btn disabled" onclick="Stars.toggleStar('category-unique-id')" title="Login to star resources">
            <i class="fa-solid fa-star"></i>
            <span class="star-count">0</span>
        </button>
        <a href="https://example.com/" class="visit-btn" target="_blank">
            Visit <i class="fa-solid fa-arrow-up-right-from-square"></i>
        </a>
        <button class="copy-btn" onclick="copyLink('https://example.com/')">
            <i class="fa-regular fa-copy"></i>
        </button>
    </div>
</div>
```

**Important:** The `data-resource-id` must be unique across the page and match the ID passed to `Stars.toggleStar()`.
```

### Modifying Course Repositories

In `courses.html`, each course uses a dropdown structure with **per-dropdown star sorting** (resources ranked within each section independently):

```html
<div class="course-dropdown">
    <button class="course-header" onclick="toggleDropdown(this)">
        <span><i class="fa-solid fa-code"></i> Course Name (CODE)</span>
        <i class="fa-solid fa-chevron-down"></i>
    </button>
    <div class="course-content">
        <div class="repo-item" data-resource-id="courses-{course}-{author}">
            <i class="fa-brands fa-github"></i>
            <div class="repo-info">
                <a href="https://github.com/..." target="_blank">@author/student-id</a>
                <p>author/repository-name</p>
            </div>
            <button class="star-btn disabled" onclick="Stars.toggleStar('courses-{course}-{author}')" title="Login to star resources">
                <i class="fa-solid fa-star"></i>
                <span class="star-count">0</span>
            </button>
        </div>
    </div>
</div>
```

**Important:** The `CoursesStars` module (inline in `courses.html`) handles starring differently than other pages — it sorts resources only within their parent `.course-content` container, not page-wide.

### Updating Form Links

The Google Form URL appears in multiple places:

| Location | Element |
|----------|---------|
| Homepage hero | `.submit-btn` |
| Category pages | `.add-link-btn` |
| Contributors empty state | `.submit-resource-btn` |

**Current Form URL:** `https://forms.gle/UR1HSavWJYdPBPnC8`

### Styling Customization

The site uses a consistent color scheme defined in `style.css`:

| Color | Usage |
|-------|-------|
| `#1a1a2e` | Primary background |
| `#16213e` | Secondary background |
| `#64b5f6` | Accent blue |
| `#e0e6ed` | Primary text |
| `#a0a0a0` | Secondary text |

---

## Google Sheets Setup

The Contributors page fetches data dynamically from a Google Sheet linked to the submission form.

### How It Works
1. User submits a resource via Google Form
2. Response is automatically saved to Google Sheet
3. Contributors page fetches sheet data via Google Visualization API
4. Data is parsed, grouped by contributor name, and displayed

### Publishing the Sheet (Required)
1. Open the Google Sheet: [Link](https://docs.google.com/spreadsheets/d/1oQ5Mkavjm62UGZwNjM-52yvKppWZHfX-Qpq6jtEVIOY/)
2. Go to **File → Share → Publish to web**
3. Select **"Entire Document"** or the specific sheet tab
4. Click **Publish** and confirm

### Column Mapping (0-indexed)

| Index | Column Name | Used For |
|-------|-------------|----------|
| 0 | Timestamp | Not displayed |
| 1 | Email Address | Not displayed |
| 2 | Student Education Email | Displayed on contributor card & modal |
| 3 | What is this submission for? | Not displayed |
| 4 | Your Name | Contributor name (grouping key) |
| 5 | Contacts and Social Links | Displayed in modal contact section |
| 6 | Project Title | Shown in modal popup |
| 7 | Project Link | Clickable link in modal |
| 8 | Project Type | Badge in modal popup |
| 9 | Department | Shown on contributor card |
| 10 | Batch | Shown on contributor card |

### Modifying Column Indices

Edit the constants at the top of the `<script>` section in `contributions.html`:

```javascript
const COL_EMAIL = 2;           // Student Education Email
const COL_NAME = 4;            // Your Name
const COL_SOCIAL = 5;          // Contacts and Social Links
const COL_PROJECT_TITLE = 6;   // Project Title
const COL_PROJECT_LINK = 7;    // Project Link
const COL_PROJECT_TYPE = 8;    // Project Type
const COL_DEPARTMENT = 9;      // Department
const COL_BATCH = 10;          // Batch
```

### Changing the Google Sheet

To use a different Google Sheet:
1. Get the Sheet ID from the URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
2. Update the `SHEET_ID` constant in `contributions.html`:
```javascript
const SHEET_ID = 'your-new-sheet-id-here';
```

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Loading spinner stuck | Ensure sheet is published to web |
| Error state shown | Check browser console for errors; verify sheet ID |
| Data not updating | Refresh the page; published sheets have slight delay |
| Wrong data displayed | Verify column indices match your form structure |

---

## Changelog

| Version | Feature / Change | Description |
| :--- | :--- | :--- |
| **v3.9** | **Dynamic JSON-Driven Rendering** | Replaced static list items on all resource pages and index featured projects marquee with a dynamic fetching loader (`js/data-renderer.js`) pulling data from individual JSON files in `json/`, preserving full Supabase starring compatibility and isolated ranking logic. |
| **v3.8** | **Reusable Auth Modal Script** | Extracted the hardcoded Auth Modal HTML template into a separate reusable `js/auth-modal.js` script dynamically injected across all category pages, index page, and guidance page. |
| **v3.7** | **Inspirations & Style Fixes** | Added `inspirations.html` with project portals from UIU/DIU. Added "All Courses" section to `courses.html`. Fixed scrollbar display and word-wrapping for long links. |
| **v3.6** | **Portfolio Expertise Tags** | Added core expertise tags (e.g., Full Stack, Cybersecurity, Backend) to each entry in `portfolios.html` for better categorization and visibility. |
| **v3.5** | **PWA & Notifications** | Enabled Progressive Web App (PWA) features including offline support, manifest installation, and browser notifications for new submissions. |
| **v3.4** | **Recent Submissions** | Added a sliding panel showing the 10 most recent contributions with clickable category links and smooth animations. Fixed individual contributor modal content. |
| **v3.3** | **Courses Star Fix** | Resolved "Failed to update star" error and consolidated repository items into single containers for proper star-based ranking. |
| **v3.2** | **Google OAuth** | Integrated "Continue with Google" for faster login, avoiding email rate limits. Added Student ID requirement for OAuth users. |
| **v3.1** | **Isolated Rankings** | Implemented per-dropdown star sorting for `courses.html`, ranking resources only within their respective course sections. |
| **v3.0** | **Auth & Starring** | Major update: Supabase integration for Student ID authentication, resource starring, and auto-sorting by popularity. |
| **v2.6** | **Guidance Page** | Added `guidance.html` for tutorials and tips, updated resource mapping. |
| **v2.5** | **Resource Linking** | Connected resource type badges in contributor modals to their respective category pages (e.g., Tools -> `tools.html`). |
| **v2.4** | **Modal Contact Info** | Added clickable contact info (Email/Socials) and department/batch subtitles to contributor modals. |
| **v2.3** | **Enhanced Modal** | Cards now open modals showing all submitted resources for that contributor. |
| **v2.2** | **Dynamic Fetching** | Linked the Contributors page to Google Sheets for real-time data updates from form submissions. |
| **v2.1** | **Contributors Page** | Initial release of the `contributions.html` page to recognize student submitters. |
| **v2.0** | **UIU Restructure** | Complete site redesign: hero section, category cards, featured marquee, and responsive navigation. |




---

## Credits

- **Design Inspiration**: [UIU LinkSphere](https://uiulinks.vercel.app/)
- **Contributors Page Design**: [DIUQBank Contributors](https://diuqbank.com/contributors/)
- **Icons**: [Font Awesome 6.5.0](https://fontawesome.com/)
- **Built by**: oU1TS Initiative - Students of UITS
