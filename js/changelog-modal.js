/**
 * Changelog / What's New Modal Module for oU1TS Portal
 * Displays website updates from changes.json when the Service Worker CACHE_NAME updates
 * Modeled on b1t-Acad changelog architecture
 */

// Embedded fallback data ensuring the modal ALWAYS opens even on file:// protocol or offline
const CHANGELOG_DATA_FALLBACK = {
  "currentVersion": "v1.1",
  "lastUpdated": "September 2026",
  "documentationUrl": "doc/history.md",
  "history": [
    {
      "version": "v1.1",
      "badge": "Latest",
      "date": "20.09.26",
      "changes": [
        {
          "type": "UI/UX",
          "title": "Top-Left Brand Subtitle & Left-to-Right Typewriter Animation",
          "description": "Relocated portal subtitles directly below the top-left site brand logo with a dynamic left-to-right typewriter effect and smooth tag reveal, completely clearing the redundant hero section."
        },
        {
          "type": "UI/UX",
          "title": "Featured Projects Compact Mobile Layout & Integrated Badges",
          "description": "Optimized the featured project carousel for mobile screens with a significantly reduced height, left-aligned thumbnail with visit button underneath, right-aligned project details, and bottom-right corner ranking tags."
        },
        {
          "type": "UI/UX",
          "title": "Compact Mobile Floating Bubbles & Single-Screen Discovery",
          "description": "Reduced diameter and padding for resource bubbles on mobile screens, fitting all 11 category links comfortably within a single viewport without tall canvas scrolling."
        },
        {
          "type": "UI/UX",
          "title": "Silky Smooth 7-Second Single Inactivity Auto-Scroll",
          "description": "Upgraded idle inactivity detection to trigger after exactly 7 seconds of inactivity for the first time only, smoothly gliding downward to the Explore Hub Resources with cubic physics easing."
        },
        {
          "type": "New Feature",
          "title": "Automated Visitor Changelog Modal & Service Worker Version Detection",
          "description": "Implemented automated 'What's New' changelog modal that triggers whenever a new Service Worker cache version is deployed, featuring desktop and mobile trigger buttons, version history accordion, and offline fallback."
        }
      ]
    },
    {
      "version": "v1.0",
      "badge": "Milestone",
      "date": "19.09.26",
      "changes": [
        {
          "type": "New Feature",
          "title": "Centered Intro Preloader with Corner Docking Animation",
          "description": "Engineered an introductory loading screen that displays centered on load and seamlessly glides into the top-left logo position using dynamic bounding rect calculations."
        },
        {
          "type": "New Feature",
          "title": "Dynamic Featured Projects Changing Gallery Carousel",
          "description": "Built an interactive showcase carousel randomly presenting top-ranked projects from curated collections with auto-rotation, arrow navigation, and pagination indicators."
        },
        {
          "type": "UI/UX",
          "title": "Playful Floating Resource Bubbles Navigation",
          "description": "Introduced an organic floating bubble canvas for exploring materials, tools, guidance, community links, and capstones with dynamic physics-inspired micro-animations."
        },
        {
          "type": "Security",
          "title": "Supabase Authentication Centralization & Secure RLS",
          "description": "Secured Supabase client access, centralized configuration in env-config.js, and implemented Row Level Security policies for user stars and capstone submissions."
        }
      ]
    }
  ]
};

const ChangelogModal = {
  data: null,
  storageKey: 'ou1ts_portal_changelog_version',
  swStorageKey: 'ou1ts_portal_sw_cache_version',

  async init() {
    this.setupEventListeners();
    await this.checkAndShowChangelog(false);
  },

  /**
   * Fetch changes.json with cache-busting and robust offline fallback
   */
  async fetchChanges() {
    if (this.data) return this.data;
    try {
      const response = await fetch('changes.json?t=' + Date.now());
      if (response && response.ok) {
        this.data = await response.json();
        return this.data;
      }
    } catch (error) {
      console.info('[ChangelogModal] fetch failed or blocked (file:// protocol), using fallback dataset');
    }
    this.data = CHANGELOG_DATA_FALLBACK;
    return this.data;
  },

  /**
   * Attempt to inspect service-worker.js CACHE_NAME for changes
   */
  async getServiceWorkerVersion() {
    try {
      const response = await fetch('service-worker.js?t=' + Date.now());
      if (response && response.ok) {
        const text = await response.text();
        const match = text.match(/CACHE_NAME\s*=\s*['"]([^'"]+)['"]/);
        if (match && match[1]) {
          return match[1];
        }
      }
    } catch (e) {
      // Offline or file:// protocol
    }
    return null;
  },

  /**
   * Check if current version or service worker CACHE_NAME is newer than last seen version
   */
  async checkAndShowChangelog(forceOpen = false) {
    const data = await this.fetchChanges();
    if (!data) return;

    const lastSeenVersion = localStorage.getItem(this.storageKey);
    const lastSeenSWVersion = localStorage.getItem(this.swStorageKey);
    const currentVersion = data.currentVersion || 'v1.1';
    const currentSWVersion = await this.getServiceWorkerVersion();

    this.updateBadgePills(currentVersion);

    const isSWUpdated = currentSWVersion && lastSeenSWVersion && currentSWVersion !== lastSeenSWVersion;
    const isVersionUpdated = !lastSeenVersion || lastSeenVersion !== currentVersion;

    if (forceOpen || isVersionUpdated || isSWUpdated) {
      this.render(data);
      this.open();
    }
  },

  /**
   * Update badge pills across UI
   */
  updateBadgePills(version) {
    const pills = document.querySelectorAll('.changelog-badge-pill');
    pills.forEach(pill => {
      pill.textContent = version;
    });
  },

  /**
   * Render changelog data into modal DOM
   */
  render(data) {
    const titleBadge = document.getElementById('changelog-version-badge');
    const bodyEl = document.getElementById('changelog-modal-body');

    if (titleBadge) {
      titleBadge.textContent = data.currentVersion || 'Latest';
    }
    this.updateBadgePills(data.currentVersion);

    if (!bodyEl) return;

    const history = data.history || [];
    if (history.length === 0) {
      bodyEl.innerHTML = '<p style="text-align: center; color: #94a3b8;">No changelog details available.</p>';
      return;
    }

    const latest = history[0];
    const olderVersions = history.slice(1);

    let html = `
      <div class="changelog-version-section">
        <div class="changelog-version-header">
          <div class="changelog-version-title">
            <span>Version ${this.escapeHtml(latest.version)}</span>
            <span class="changelog-tag ${this.getTagClass(latest.badge || 'Latest')}">${this.escapeHtml(latest.badge || 'Latest')}</span>
          </div>
          <span class="changelog-date">${this.escapeHtml(latest.date || '')}</span>
        </div>
        <div class="changelog-items-list">
          ${(latest.changes || []).map(change => `
            <div class="changelog-item">
              <div class="changelog-item-title-row">
                <span class="changelog-tag ${this.getTagClass(change.type)}">${this.escapeHtml(change.type || 'Update')}</span>
                <span class="changelog-item-title">${this.escapeHtml(change.title || '')}</span>
              </div>
              <p class="changelog-item-desc">${this.escapeHtml(change.description || '')}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Render older versions accordion if available
    if (olderVersions.length > 0) {
      html += `
        <button id="changelog-history-toggle" class="changelog-history-toggle" type="button" aria-expanded="false">
          <span><i class="fa-solid fa-clock-rotate-left"></i> View Earlier Updates (${olderVersions.length} versions)</span>
          <i class="fa-solid fa-chevron-down changelog-chevron"></i>
        </button>
        <div id="changelog-history-list" class="changelog-history-list">
          ${olderVersions.map(ver => `
            <div class="changelog-history-item">
              <div class="changelog-history-header">
                <div class="changelog-history-version">
                  <span>${this.escapeHtml(ver.version)}</span>
                  ${ver.badge ? `<span class="changelog-tag ${this.getTagClass(ver.badge)}">${this.escapeHtml(ver.badge)}</span>` : ''}
                </div>
                <span class="changelog-date">${this.escapeHtml(ver.date || '')}</span>
              </div>
              <div class="changelog-items-list">
                ${(ver.changes || []).map(change => `
                  <div class="changelog-item">
                    <div class="changelog-item-title-row">
                      <span class="changelog-tag ${this.getTagClass(change.type)}">${this.escapeHtml(change.type || 'Update')}</span>
                      <span class="changelog-item-title">${this.escapeHtml(change.title || '')}</span>
                    </div>
                    <p class="changelog-item-desc">${this.escapeHtml(change.description || '')}</p>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    bodyEl.innerHTML = html;

    // Attach accordion toggle listener
    const historyToggle = document.getElementById('changelog-history-toggle');
    const historyList = document.getElementById('changelog-history-list');
    if (historyToggle && historyList) {
      historyToggle.addEventListener('click', () => {
        const isOpen = historyList.classList.toggle('open');
        historyToggle.classList.toggle('active', isOpen);
        historyToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
    }
  },

  /**
   * Helper to get CSS class for a change badge/tag
   */
  getTagClass(type) {
    if (!type) return 'enhancement';
    const lower = type.toLowerCase();
    if (lower.includes('feature')) return 'new-feature';
    if (lower.includes('fix') || lower.includes('bug')) return 'fix';
    if (lower.includes('security')) return 'security';
    if (lower.includes('major')) return 'major';
    if (lower.includes('ui') || lower.includes('ux')) return 'ui-ux';
    if (lower.includes('refactor')) return 'refactor';
    if (lower.includes('doc')) return 'docs';
    return 'enhancement';
  },

  /**
   * Basic HTML escaping for safe rendering
   */
  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /**
   * Setup modal event listeners with robust global delegation
   */
  setupEventListeners() {
    const handleDismiss = async () => {
      this.close();
      if (this.data && this.data.currentVersion) {
        localStorage.setItem(this.storageKey, this.data.currentVersion);
      }
      const currentSW = await this.getServiceWorkerVersion();
      if (currentSW) {
        localStorage.setItem(this.swStorageKey, currentSW);
      }
    };

    document.addEventListener('click', (e) => {
      // Trigger buttons
      const trigger = e.target.closest('#desktop-changelog-btn, #mobile-changelog-btn, .view-changelog-btn, [data-open-changelog]');
      if (trigger) {
        e.preventDefault();
        e.stopPropagation();
        this.checkAndShowChangelog(true);
        return;
      }

      // Close & got-it buttons
      const closeBtn = e.target.closest('#close-changelog-modal, #changelog-modal-got-it-btn');
      if (closeBtn) {
        e.preventDefault();
        handleDismiss();
        return;
      }

      // Backdrop click dismiss
      const modal = document.getElementById('changelog-modal');
      if (modal && e.target === modal) {
        handleDismiss();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      const modal = document.getElementById('changelog-modal');
      if (e.key === 'Escape' && modal && modal.style.display !== 'none') {
        handleDismiss();
      }
    });
  },

  /**
   * Open the Changelog Modal
   */
  open() {
    const modal = document.getElementById('changelog-modal');
    if (modal) {
      modal.style.setProperty('display', 'flex', 'important');
      document.body.classList.add('no-scroll');
    }
  },

  /**
   * Close the Changelog Modal
   */
  close() {
    const modal = document.getElementById('changelog-modal');
    if (modal) {
      modal.style.setProperty('display', 'none', 'important');
      document.body.classList.remove('no-scroll');
    }
  }
};

window.ChangelogModal = ChangelogModal;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    ChangelogModal.init();
  });
} else {
  ChangelogModal.init();
}
