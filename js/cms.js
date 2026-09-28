// js/cms.js
// oU1TS Portal Content Management System (CMS) & Admin Delegation Module
// Handles Google Sheet Form Submissions Tracking, Resource Approvals, Central DB Catalog Management,
// Feedback Triage, and Administrator Role Delegation.

(function () {
    const CMS = {
        activeTab: 'submissions',
        submissionFilter: 'all', // 'all', 'pending', 'already_added', 'feedback'
        sheetSubmissionsCache: [],
        resourcesCache: [],
        feedbackCache: [],
        usersCache: [],
        selectedCategory: 'all',
        searchTerm: '',
        userSearchTerm: '',
        userRoleFilter: 'all',

        init() {
            this.injectModal();
            this.bindEvents();
            this.updateUI();
        },

        // Update UI visibility depending on admin status
        updateUI() {
            const adminBtn = document.getElementById('adminCmsBtn');
            const isAdmin = window.Auth && window.Auth.currentUser && window.Auth.currentUser.isPortalAdmin;
            if (adminBtn) {
                adminBtn.style.display = isAdmin ? 'inline-flex' : 'none';
            }
        },

        // Helper to get all active tab content targets (Modal and/or Inline SPA view)
        getActiveContentContainers() {
            const targets = [];
            const modalContent = document.getElementById('adminCmsContent');
            const inlineContent = document.getElementById('adminCmsContentInline');
            if (modalContent) targets.push(modalContent);
            if (inlineContent) targets.push(inlineContent);
            return targets;
        },

        // Update count badges across both modal and inline view
        updateCountBadge(idSuffix, count) {
            const elModal = document.getElementById(`cms${idSuffix}Count`);
            const elInline = document.getElementById(`cms${idSuffix}CountInline`);
            if (elModal) elModal.textContent = count;
            if (elInline) elInline.textContent = count;
        },

        // Inject CMS Resource & User Sub-Modals into DOM
        injectModal() {
            if (document.getElementById('cmsResourceModal')) return;

            const modalHtml = `
            <!-- Resource Add/Edit Sub-Modal -->
            <div id="cmsResourceModal" class="admin-cms-submodal-overlay" style="display: none;">
                <div class="admin-cms-submodal-box">
                    <div class="admin-cms-submodal-header">
                        <h3 id="cmsResourceModalTitle">Add New Resource</h3>
                        <button class="admin-cms-close-btn" onclick="CMS.closeResourceModal()"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <form id="cmsResourceForm" onsubmit="CMS.handleSaveResource(event)">
                        <input type="hidden" id="resEditId" value="">
                        <input type="hidden" id="resSheetRowId" value="">
                        <div class="cms-form-group">
                            <label>Resource Title *</label>
                            <input type="text" id="resTitle" required placeholder="e.g. Puzzle Solver">
                        </div>
                        <div class="cms-form-row">
                            <div class="cms-form-group">
                                <label>Category *</label>
                                <select id="resCategory" required>
                                    <option value="courses">Course Repositories</option>
                                    <option value="tools">Tools</option>
                                    <option value="materials">Materials</option>
                                    <option value="guidance">Guidance</option>
                                    <option value="community">Community</option>
                                    <option value="official">Official</option>
                                    <option value="portfolios">Portfolios</option>
                                    <option value="capstones">Capstones</option>
                                    <option value="mentors">Mentors</option>
                                    <option value="talent">Talent</option>
                                </select>
                            </div>
                            <div class="cms-form-group">
                                <label>Status *</label>
                                <select id="resStatus" required>
                                    <option value="approved">Approved (Live on Website)</option>
                                    <option value="pending">Pending Review</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>
                        </div>
                        <div class="cms-form-row">
                            <div class="cms-form-group">
                                <label>Destination / Visit URL *</label>
                                <input type="url" id="resUrl" required placeholder="https://...">
                            </div>
                            <div class="cms-form-group">
                                <label>Copy / Share URL</label>
                                <input type="url" id="resCopyUrl" placeholder="https://...">
                            </div>
                        </div>
                        <div class="cms-form-group">
                            <label>Description / Notes</label>
                            <textarea id="resDesc" rows="3" placeholder="Brief summary of this resource..."></textarea>
                        </div>
                        <div class="cms-form-row">
                            <div class="cms-form-group">
                                <label>Tags (Comma-separated)</label>
                                <input type="text" id="resTags" placeholder="CSE, Batch 55, AI Project">
                            </div>
                            <div class="cms-form-group">
                                <label>Sort Order</label>
                                <input type="number" id="resSortOrder" value="0" min="0">
                            </div>
                        </div>
                        <div class="cms-modal-actions">
                            <button type="button" class="cms-btn-secondary" onclick="CMS.closeResourceModal()">Cancel</button>
                            <button type="submit" class="cms-btn-primary" id="resSubmitBtn">Save & Publish</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- User Add/Edit Sub-Modal -->
            <div id="cmsUserModal" class="admin-cms-submodal-overlay" style="display: none;">
                <div class="admin-cms-submodal-box">
                    <div class="admin-cms-submodal-header">
                        <h3 id="cmsUserModalTitle"><i class="fa-solid fa-user-plus" style="color: #a855f7;"></i> Add User to Admin Delegation</h3>
                        <button class="admin-cms-close-btn" onclick="CMS.closeUserModal()"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <form id="cmsUserForm" onsubmit="CMS.handleSaveUser(event)">
                        <input type="hidden" id="userEditId" value="">
                        <div class="cms-form-group">
                            <label>Email Address *</label>
                            <input type="email" id="userEmail" required placeholder="name@email.com or student@uits.edu.bd">
                        </div>
                        <div class="cms-form-row">
                            <div class="cms-form-group">
                                <label>Full Name</label>
                                <input type="text" id="userFullName" placeholder="e.g. Md. Sakib Hosen">
                            </div>
                            <div class="cms-form-group">
                                <label>Student ID</label>
                                <input type="text" id="userStudentId" placeholder="e.g. 0432220005101058">
                            </div>
                        </div>
                        <div class="cms-form-row">
                            <div class="cms-form-group">
                                <label>Department</label>
                                <input type="text" id="userDepartment" placeholder="e.g. CSE">
                            </div>
                            <div class="cms-form-group">
                                <label>Batch</label>
                                <input type="text" id="userBatch" placeholder="e.g. 52">
                            </div>
                        </div>
                        <input type="hidden" id="userIsAdmin" value="false">
                        <div class="cms-form-hint-box">
                            <i class="fa-solid fa-circle-info" style="color: #38bdf8;"></i>
                            <span>New students are added as regular <strong>Portal Members</strong>. Administrator privileges can be toggled directly from the user list.</span>
                        </div>
                        <div class="cms-modal-actions">
                            <button type="button" class="cms-btn-secondary" onclick="CMS.closeUserModal()">Cancel</button>
                            <button type="submit" class="cms-btn-primary" id="userSubmitBtn">
                                <i class="fa-solid fa-user-check"></i> Save User
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);
        },

        // Render full inline workspace for the dedicated #cms SPA view
        renderInlineWorkspace(containerId) {
            const container = document.getElementById(containerId);
            if (!container) return;

            container.innerHTML = `
                <div class="admin-cms-tabs cms-inline-tabs">
                    <button class="cms-tab-btn ${this.activeTab === 'submissions' ? 'active' : ''}" data-tab="submissions" title="Submissions & Approvals">
                        <i class="fa-solid fa-inbox"></i> <span class="cms-tab-label">Submissions & Approvals</span>
                        <span class="cms-count-badge" id="cmsSubmissionsCountInline">0</span>
                    </button>
                    <button class="cms-tab-btn ${this.activeTab === 'resources' ? 'active' : ''}" data-tab="resources" title="Content Manager">
                        <i class="fa-solid fa-layer-group"></i> <span class="cms-tab-label">Content Manager</span>
                        <span class="cms-count-badge" id="cmsResourcesCountInline">0</span>
                    </button>
                    <button class="cms-tab-btn ${this.activeTab === 'feedback' ? 'active' : ''}" data-tab="feedback" title="Feedback Inbox">
                        <i class="fa-solid fa-comments"></i> <span class="cms-tab-label">Feedback Inbox</span>
                        <span class="cms-count-badge" id="cmsFeedbackCountInline">0</span>
                    </button>
                    <button class="cms-tab-btn ${this.activeTab === 'admins' ? 'active' : ''}" data-tab="admins" title="Admin User Selector">
                        <i class="fa-solid fa-user-shield"></i> <span class="cms-tab-label">Admin User Selector</span>
                        <span class="cms-count-badge" id="cmsAdminsCountInline">0</span>
                    </button>
                </div>

                <!-- Inline Alert Area -->
                <div id="cmsAlertBannerInline" class="cms-alert-banner" style="display:none;"></div>

                <!-- Inline Content Area -->
                <div class="admin-cms-content" id="adminCmsContentInline">
                    <div class="cms-loader-area">
                        <i class="fa-solid fa-spinner fa-spin"></i>
                        <p>Loading management dashboard...</p>
                    </div>
                </div>
            `;

            this.switchTab(this.activeTab);
        },

        bindEvents() {
            // Tab clicks (works for both modal and inline)
            document.addEventListener('click', (e) => {
                const tabBtn = e.target.closest('.cms-tab-btn');
                if (tabBtn) {
                    const tab = tabBtn.getAttribute('data-tab');
                    this.switchTab(tab);
                }
            });

            // Close modal button
            document.addEventListener('click', (e) => {
                if (e.target.closest('#adminCmsCloseBtn')) {
                    this.closeCMSModal();
                }
            });

            // Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    const userModal = document.getElementById('cmsUserModal');
                    if (userModal && userModal.style.display !== 'none') {
                        this.closeUserModal();
                        return;
                    }
                    const subModal = document.getElementById('cmsResourceModal');
                    if (subModal && subModal.style.display !== 'none') {
                        this.closeResourceModal();
                        return;
                    }
                    // Sub-modal close on escape
                }
            });

            // Sync Google Form button
            document.addEventListener('click', (e) => {
                if (e.target.closest('#cmsSyncSheetBtn') || e.target.closest('#cmsPageSyncSheetBtn')) {
                    this.syncFromGoogleSheet();
                }
            });
        },

        openCMSModal(tab = 'submissions') {
            const isAdmin = window.Auth && window.Auth.currentUser && window.Auth.currentUser.isPortalAdmin;
            if (!isAdmin) {
                alert('Access Restricted: You must be a verified Portal Administrator to access the CMS.');
                return;
            }

            this.activeTab = tab;
            if (window.location.hash !== '#cms') {
                window.location.hash = '#cms';
            } else {
                this.switchTab(tab);
            }
        },

        closeCMSModal() {
            this.closeResourceModal();
            this.closeUserModal();
        },

        switchTab(tab) {
            this.activeTab = tab;
            document.querySelectorAll('.cms-tab-btn').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
            });

            if (tab === 'submissions') {
                this.renderSubmissionsTab();
            } else if (tab === 'resources') {
                this.renderResourcesTab();
            } else if (tab === 'feedback') {
                this.renderFeedbackTab();
            } else if (tab === 'admins') {
                this.renderAdminsTab();
            }
        },

        showAlert(message, type = 'success') {
            const banners = [
                document.getElementById('cmsAlertBanner'),
                document.getElementById('cmsAlertBannerInline')
            ].filter(Boolean);

            banners.forEach(b => {
                b.className = `cms-alert-banner ${type}`;
                b.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation'}"></i> <span>${message}</span>`;
                b.style.display = 'flex';
            });

            setTimeout(() => {
                banners.forEach(b => b.style.display = 'none');
            }, 4500);
        },

        // Helper: Category detector based on submission text
        detectCategory(typeOrFor = '') {
            const str = (typeOrFor || '').toLowerCase();
            if (str.includes('course') || str.includes('repo')) return 'courses';
            if (str.includes('tool')) return 'tools';
            if (str.includes('portfolio')) return 'portfolios';
            if (str.includes('guide') || str.includes('guidance')) return 'guidance';
            if (str.includes('capstone') || str.includes('thesis')) return 'capstones';
            if (str.includes('mentor')) return 'mentors';
            if (str.includes('talent')) return 'talent';
            if (str.includes('community')) return 'community';
            if (str.includes('official')) return 'official';
            return 'materials';
        },

        // ======================================================================
        // TAB 1: GOOGLE SHEET SUBMISSIONS & APPROVALS
        // ======================================================================
        async fetchSheetSubmissions() {
            let submissions = [];

            // 1. Try querying Supabase public.portal_sheet_submissions
            if (window.supabaseClient) {
                try {
                    const { data, error } = await window.supabaseClient
                        .from('portal_sheet_submissions')
                        .select('*')
                        .order('sheet_row_number', { ascending: false });

                    if (!error && Array.isArray(data) && data.length > 0) {
                        this.sheetSubmissionsCache = data;
                        return data;
                    }
                } catch (dbErr) {
                    console.warn('[CMS] Supabase query for portal_sheet_submissions failed, falling back to sheet API:', dbErr);
                }
            }

            // 2. Fallback: Parse Google Sheets API directly & match with catalog
            try {
                const SHEET_ID = '1oQ5Mkavjm62UGZwNjM-52yvKppWZHfX-Qpq6jtEVIOY';
                const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;
                const res = await fetch(SHEET_URL);
                if (!res.ok) throw new Error('Failed to fetch Google Sheet data');
                const raw = await res.text();
                const jsonStr = raw.substring(raw.indexOf('(') + 1, raw.lastIndexOf(')'));
                const gData = JSON.parse(jsonStr);
                const rows = gData.table?.rows || [];

                // Load existing resources to match
                let existingCatalog = [];
                if (window.supabaseClient) {
                    const { data: resData } = await window.supabaseClient.from('portal_resources').select('id, title, url');
                    if (resData) existingCatalog = resData;
                }

                // If catalog empty, use static known mappings
                const knownMappings = {
                    2: 'tools-handgesture',
                    3: 'courses-dsa1-robiul',
                    4: 'portfolio-chatokjnr',
                    5: 'portfolio-atikshahria',
                    6: 'courses-cg-Arriesgado47',
                    7: 'portfolio-#',
                    8: 'capstone-research-archive',
                    9: 'guidance-research-pub',
                    10: 'courses-cg-4xrhd',
                    11: 'courses-all-4xrhd',
                    13: 'guidance-research-pub'
                };

                rows.forEach((r, idx) => {
                    const rowNum = idx + 2;
                    const c = r.c || [];
                    const time = c[0] ? (c[0].f || c[0].v || '') : '';
                    const email = c[1]?.v ? String(c[1].v).trim() : '';
                    const studentId = c[2]?.v ? String(c[2].v).trim() : '';
                    const submissionFor = c[3]?.v ? String(c[3].v).trim() : '';
                    const name = c[4]?.v ? String(c[4].v).trim() : '';
                    const social = c[5]?.v ? String(c[5].v).trim() : '';
                    const projectTitle = c[6]?.v ? String(c[6].v).trim() : '';
                    const projectLink = c[7]?.v ? String(c[7].v).trim() : '';
                    const projectType = c[8]?.v ? String(c[8].v).trim() : '';
                    const expertise = c[9]?.v ? String(c[9].v).trim() : '';
                    const department = c[10]?.v ? String(c[10].v).trim() : '';
                    const batch = c[11]?.v ? String(c[11].v).trim() : '';
                    const details = c[12]?.v ? String(c[12].v).trim() : '';

                    if (!name || name.toLowerCase() === 'your name') return;

                    const isFeedback = (projectType && projectType.toUpperCase().includes('FEEDBACK')) ||
                                       (submissionFor && submissionFor.toUpperCase().includes('FEEDBACK'));

                    let status = 'pending';
                    let mappedId = null;

                    if (isFeedback) {
                        status = 'feedback';
                    } else if (knownMappings[rowNum]) {
                        status = 'already_added';
                        mappedId = knownMappings[rowNum];
                    } else {
                        // Check against live existingCatalog
                        const matched = existingCatalog.find(item => {
                            if (projectLink && item.url && (item.url.toLowerCase() === projectLink.toLowerCase() || item.url.includes(projectLink) || projectLink.includes(item.url))) return true;
                            if (projectTitle && item.title && item.title.toLowerCase().includes(projectTitle.toLowerCase())) return true;
                            return false;
                        });
                        if (matched) {
                            status = 'already_added';
                            mappedId = matched.id;
                        } else {
                            status = 'pending'; // Needs approval!
                        }
                    }

                    submissions.push({
                        sheet_row_id: `sheet_row_${rowNum}`,
                        sheet_row_number: rowNum,
                        submitted_at: time,
                        submitter_email: email,
                        student_id: studentId,
                        submission_for: submissionFor,
                        submitter_name: name,
                        submitter_social: social,
                        project_title: projectTitle,
                        project_link: projectLink,
                        project_type: projectType,
                        portfolio_expertise: expertise,
                        department: department,
                        batch: batch,
                        additional_details: details,
                        status: status,
                        mapped_resource_id: mappedId
                    });
                });

                // Sort descending (latest sheet entries first)
                submissions.sort((a, b) => b.sheet_row_number - a.sheet_row_number);
                this.sheetSubmissionsCache = submissions;
                return submissions;

            } catch (err) {
                console.error('[CMS] Failed to fetch sheet submissions:', err);
                return this.sheetSubmissionsCache || [];
            }
        },

        setSubmissionFilter(filter) {
            this.submissionFilter = filter;
            this.renderSubmissionsTab();
        },

        toggleSubmissionCard(headerEl) {
            if (!headerEl) return;
            const card = headerEl.closest('.cms-submission-card');
            if (card) {
                card.classList.toggle('is-expanded');
            }
        },

        async renderSubmissionsTab() {
            const containers = this.getActiveContentContainers();
            if (containers.length === 0) return;

            containers.forEach(c => {
                c.innerHTML = `
                    <div class="cms-loader-area">
                        <i class="fa-solid fa-spinner fa-spin"></i>
                        <p>Loading Google Sheet form responses & status...</p>
                    </div>
                `;
            });

            try {
                const submissions = await this.fetchSheetSubmissions();

                // Compute counts
                const pendingCount = submissions.filter(s => s.status === 'pending').length;
                const alreadyAddedCount = submissions.filter(s => s.status === 'already_added' || s.status === 'approved').length;
                const feedbackCount = submissions.filter(s => s.status === 'feedback').length;
                const totalCount = submissions.length;

                this.updateCountBadge('Submissions', totalCount);

                // Filter list
                let filtered = submissions;
                if (this.submissionFilter === 'pending') {
                    filtered = submissions.filter(s => s.status === 'pending');
                } else if (this.submissionFilter === 'already_added') {
                    filtered = submissions.filter(s => s.status === 'already_added' || s.status === 'approved');
                } else if (this.submissionFilter === 'feedback') {
                    filtered = submissions.filter(s => s.status === 'feedback');
                }

                let html = `
                    <div class="cms-toolbar">
                        <div class="cms-toolbar-left">
                            <span class="cms-section-title">
                                <i class="fa-solid fa-file-waveform"></i> Google Sheet Form Submissions
                            </span>
                            <span class="cms-subtitle-hint">
                                Tracking responses from Google Sheets Form. Unadded projects automatically route to <strong>Needs Approval</strong>.
                            </span>
                        </div>
                    </div>

                    <!-- Filter Pills (Desktop View) -->
                    <div class="cms-filter-pills cms-desktop-filter-pills">
                        <button class="cms-filter-pill ${this.submissionFilter === 'all' ? 'active' : ''}" onclick="CMS.setSubmissionFilter('all')">
                            <i class="fa-solid fa-layer-group"></i> All Submissions <span class="pill-count">${totalCount}</span>
                        </button>
                        <button class="cms-filter-pill ${this.submissionFilter === 'pending' ? 'active' : ''}" onclick="CMS.setSubmissionFilter('pending')">
                            <i class="fa-solid fa-triangle-exclamation" style="color: #fbbf24;"></i> Needs Approval <span class="pill-count">${pendingCount}</span>
                        </button>
                        <button class="cms-filter-pill ${this.submissionFilter === 'already_added' ? 'active' : ''}" onclick="CMS.setSubmissionFilter('already_added')">
                            <i class="fa-solid fa-circle-check" style="color: #34d399;"></i> Already on Website <span class="pill-count">${alreadyAddedCount}</span>
                        </button>
                        <button class="cms-filter-pill ${this.submissionFilter === 'feedback' ? 'active' : ''}" onclick="CMS.setSubmissionFilter('feedback')">
                            <i class="fa-solid fa-comments" style="color: #38bdf8;"></i> Feedback <span class="pill-count">${feedbackCount}</span>
                        </button>
                    </div>

                    <!-- Filter Controls (Mobile View: Single Dropdown encompassing all submissions including Feedbacks) -->
                    <div class="cms-mobile-filter-bar">
                        <div class="cms-category-select cms-mobile-sub-select">
                            <select id="cmsMobileSubFilter" onchange="CMS.setSubmissionFilter(this.value)">
                                <option value="all" ${this.submissionFilter === 'all' ? 'selected' : ''}>All Submissions (${totalCount})</option>
                                <option value="pending" ${this.submissionFilter === 'pending' ? 'selected' : ''}>⚠️ Needs Approval (${pendingCount})</option>
                                <option value="already_added" ${this.submissionFilter === 'already_added' ? 'selected' : ''}>✅ Already on Website (${alreadyAddedCount})</option>
                                <option value="feedback" ${this.submissionFilter === 'feedback' ? 'selected' : ''}>💬 Feedbacks (${feedbackCount})</option>
                            </select>
                        </div>
                    </div>
                `;

                if (filtered.length === 0) {
                    html += `
                        <div class="cms-empty-state">
                            <i class="fa-solid fa-inbox"></i>
                            <h3>No Submissions Found</h3>
                            <p>No submissions match the filter "<strong>${this.submissionFilter}</strong>". Use "Sync Google Form" to pull the latest entries.</p>
                        </div>
                    `;
                } else {
                    html += `<div class="cms-submissions-grid">`;
                    filtered.forEach(sub => {
                        const isPending = sub.status === 'pending';
                        const isAlready = sub.status === 'already_added';
                        const isApproved = sub.status === 'approved';
                        const isFb = sub.status === 'feedback';

                        let badgeHtml = '';
                        if (isPending) {
                            badgeHtml = `<span class="cms-status-tag status-pending"><i class="fa-solid fa-triangle-exclamation"></i> Needs Approval</span>`;
                        } else if (isAlready) {
                            badgeHtml = `<span class="cms-status-tag status-already_added"><i class="fa-solid fa-circle-check"></i> Already on Website</span>`;
                        } else if (isApproved) {
                            badgeHtml = `<span class="cms-status-tag status-approved"><i class="fa-solid fa-check"></i> Approved & Added</span>`;
                        } else if (isFb) {
                            badgeHtml = `<span class="cms-status-tag status-feedback"><i class="fa-solid fa-comment"></i> Feedback</span>`;
                        } else {
                            badgeHtml = `<span class="cms-status-tag status-${sub.status}">${(sub.status || 'pending').toUpperCase()}</span>`;
                        }

                        const submitter = sub.submitter_name || 'Anonymous Student';
                        const deptBatch = [sub.department, sub.batch ? `Batch ${sub.batch}` : ''].filter(Boolean).join(' • ');
                        const detectedCat = this.detectCategory(sub.project_type || sub.submission_for);

                        html += `
                            <div class="cms-submission-card status-${sub.status || 'pending'}">
                                <div class="cms-sub-card-header" onclick="CMS.toggleSubmissionCard(this)">
                                    <div class="cms-sub-card-top">
                                        <div>
                                            <span class="cms-sub-cat-pill">${sub.project_type || detectedCat}</span>
                                            <span style="color: #64748b; font-size: 0.75rem; margin-left: 6px;">Row #${sub.sheet_row_number}</span>
                                        </div>
                                        ${badgeHtml}
                                    </div>
                                    <div class="cms-sub-title-row">
                                        <h4 class="cms-sub-title">${sub.project_title || 'Untitled Resource'}</h4>
                                        <i class="fa-solid fa-chevron-down cms-sub-card-chevron" aria-hidden="true"></i>
                                    </div>
                                </div>

                                <div class="cms-sub-card-body">
                                    ${sub.additional_details ? `<p class="cms-sub-desc">${sub.additional_details}</p>` : '<p class="cms-sub-desc" style="color: #64748b; font-style: italic;">No additional notes provided.</p>'}
                                    
                                    <div class="cms-sub-meta">
                                        <div><i class="fa-solid fa-user"></i> <strong>${submitter}</strong></div>
                                        ${deptBatch ? `<div><i class="fa-solid fa-graduation-cap"></i> ${deptBatch}</div>` : ''}
                                        ${sub.student_id ? `<div><i class="fa-solid fa-id-card"></i> ${sub.student_id}</div>` : ''}
                                        ${sub.submitter_email ? `<div><i class="fa-solid fa-envelope"></i> ${sub.submitter_email}</div>` : ''}
                                        ${sub.submitter_social ? `<div><i class="fa-solid fa-share-nodes"></i> <a href="${sub.submitter_social}" class="cms-social-link" target="_blank" rel="noopener noreferrer">Submitter Contact/Social</a></div>` : ''}
                                        <div><i class="fa-solid fa-clock"></i> ${sub.submitted_at || 'Recent'}</div>
                                    </div>

                                    ${sub.project_link ? `
                                        <div class="cms-sub-url-box">
                                            <a href="${sub.project_link}" target="_blank" rel="noopener noreferrer">
                                                <i class="fa-solid fa-link"></i> ${sub.project_link}
                                            </a>
                                        </div>
                                    ` : ''}

                                    ${sub.mapped_resource_id ? `
                                        <div class="cms-sub-card-mapped">
                                            <i class="fa-solid fa-database"></i> Mapped Catalog ID: <strong>${sub.mapped_resource_id}</strong>
                                        </div>
                                    ` : ''}

                                    <div class="cms-sub-actions">
                                        ${isPending ? `
                                            <button class="cms-btn-action approve" onclick="CMS.openApprovalModal('${sub.sheet_row_id}')">
                                                <i class="fa-solid fa-check"></i> Approve & Add to Website
                                            </button>
                                            <button class="cms-btn-action reject" onclick="CMS.rejectSheetSubmission('${sub.sheet_row_id}')">
                                                <i class="fa-solid fa-xmark"></i> Reject
                                            </button>
                                        ` : ''}

                                        ${(isAlready || isApproved) ? `
                                            <button class="cms-btn-secondary" style="font-size: 0.82rem; padding: 6px 12px;" onclick="CMS.viewMappedResource('${sub.mapped_resource_id}', '${detectedCat}')">
                                                <i class="fa-solid fa-arrow-up-right-from-square"></i> View in Catalog
                                            </button>
                                        ` : ''}

                                        ${isFb ? `
                                            <button class="cms-btn-secondary" style="font-size: 0.82rem; padding: 6px 12px;" onclick="CMS.switchTab('feedback')">
                                                <i class="fa-solid fa-comments"></i> View in Feedback Inbox
                                            </button>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                    html += `</div>`;
                }

                containers.forEach(c => c.innerHTML = html);

            } catch (err) {
                console.error('[CMS] Error rendering submissions tab:', err);
                containers.forEach(c => {
                    c.innerHTML = `<div class="cms-error-state"><i class="fa-solid fa-triangle-exclamation"></i> Error loading submissions: ${err.message}</div>`;
                });
            }
        },

        // Open approval modal pre-filled with the Google Sheet submission details
        openApprovalModal(sheetRowId) {
            const sub = this.sheetSubmissionsCache.find(s => s.sheet_row_id === sheetRowId);
            if (!sub) return;

            const category = this.detectCategory(sub.project_type || sub.submission_for);
            const cleanSlug = (sub.project_title || 'resource')
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
            const authorPrefix = (sub.submitter_name || '').split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
            const generatedId = `${category}-${authorPrefix ? authorPrefix + '-' : ''}${cleanSlug}`;

            document.getElementById('resSheetRowId').value = sub.sheet_row_id;
            document.getElementById('resEditId').value = generatedId;
            document.getElementById('resTitle').value = sub.project_title || '';
            document.getElementById('resCategory').value = category;
            document.getElementById('resStatus').value = 'approved';
            document.getElementById('resUrl').value = sub.project_link || '';
            document.getElementById('resCopyUrl').value = sub.project_link || '';
            document.getElementById('resDesc').value = sub.additional_details || `Contributed by ${sub.submitter_name} (${sub.department} Batch ${sub.batch})`;
            document.getElementById('resTags').value = [sub.department, sub.batch ? `Batch ${sub.batch}` : '', 'Student Project'].filter(Boolean).join(', ');
            document.getElementById('resSortOrder').value = 0;

            document.getElementById('cmsResourceModalTitle').innerHTML = `
                <i class="fa-solid fa-circle-check" style="color:#a855f7;"></i> Approve Submission: ${sub.project_title}
            `;
            document.getElementById('resSubmitBtn').textContent = 'Approve & Publish to Website';

            const subModal = document.getElementById('cmsResourceModal');
            if (subModal) subModal.style.display = 'flex';
        },

        async rejectSheetSubmission(sheetRowId) {
            if (!confirm(`Are you sure you want to mark submission "${sheetRowId}" as rejected?`)) return;
            try {
                if (window.supabaseClient) {
                    await window.supabaseClient
                        .from('portal_sheet_submissions')
                        .update({ status: 'rejected', updated_at: new Date().toISOString() })
                        .eq('sheet_row_id', sheetRowId);
                }

                // Update local cache
                const item = this.sheetSubmissionsCache.find(s => s.sheet_row_id === sheetRowId);
                if (item) item.status = 'rejected';

                this.showAlert('Submission marked as rejected.', 'success');
                this.renderSubmissionsTab();
            } catch (err) {
                console.error('[CMS] Reject failed:', err);
                this.showAlert(`Rejection failed: ${err.message}`, 'error');
            }
        },

        viewMappedResource(mappedId, detectedCategory) {
            this.closeCMSModal();
            const cat = detectedCategory || (mappedId ? mappedId.split('-')[0] : 'courses');
            window.location.hash = `#${cat}`;
            setTimeout(() => {
                const el = document.getElementById(`proj-${mappedId}`) || document.querySelector(`[data-id="${mappedId}"]`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.style.boxShadow = '0 0 25px rgba(168, 85, 247, 0.8)';
                    setTimeout(() => { el.style.boxShadow = ''; }, 3000);
                }
            }, 350);
        },

        // ======================================================================
        // TAB 2: CONTENT MANAGER (CENTRAL DB PORTAL_RESOURCES)
        // ======================================================================
        async renderResourcesTab() {
            const containers = this.getActiveContentContainers();
            if (containers.length === 0) return;

            containers.forEach(c => {
                c.innerHTML = `
                    <div class="cms-loader-area">
                        <i class="fa-solid fa-spinner fa-spin"></i>
                        <p>Loading database resources...</p>
                    </div>
                `;
            });

            try {
                let resources = [];
                if (window.supabaseClient) {
                    let query = window.supabaseClient
                        .from('portal_resources')
                        .select('*')
                        .order('sort_order', { ascending: true })
                        .order('created_at', { ascending: false });

                    if (this.selectedCategory !== 'all') {
                        query = query.eq('category', this.selectedCategory);
                    }

                    const { data, error } = await query;
                    if (!error && data) {
                        resources = data;
                        this.resourcesCache = data;
                    }
                }

                this.updateCountBadge('Resources', resources.length);

                let filtered = resources;
                if (this.searchTerm) {
                    const term = this.searchTerm.toLowerCase();
                    filtered = resources.filter(r =>
                        (r.title && r.title.toLowerCase().includes(term)) ||
                        (r.id && r.id.toLowerCase().includes(term)) ||
                        (r.description && r.description.toLowerCase().includes(term))
                    );
                }

                let html = `
                    <div class="cms-toolbar">
                        <div class="cms-toolbar-left">
                            <span class="cms-section-title"><i class="fa-solid fa-layer-group"></i> Central Database Catalog (${resources.length})</span>
                            <span class="cms-subtitle-hint">Live records in <code>portal_resources</code> table loaded directly across all category pages.</span>
                        </div>
                        <div class="cms-toolbar-actions">
                            <button class="cms-btn-primary" onclick="CMS.openAddResourceModal()">
                                <i class="fa-solid fa-plus"></i> Add New Resource
                            </button>
                        </div>
                    </div>

                    <div class="cms-filters-bar">
                        <div class="cms-search-box">
                            <i class="fa-solid fa-magnifying-glass"></i>
                            <input type="text" id="cmsResourceSearch" placeholder="Search by title, slug, or tags..." 
                                value="${this.searchTerm}" oninput="CMS.handleSearch(this.value)">
                        </div>
                        <div class="cms-category-select">
                            <select id="cmsCategoryFilter" onchange="CMS.handleCategoryFilter(this.value)">
                                <option value="all" ${this.selectedCategory === 'all' ? 'selected' : ''}>All Categories</option>
                                <option value="materials" ${this.selectedCategory === 'materials' ? 'selected' : ''}>Materials</option>
                                <option value="tools" ${this.selectedCategory === 'tools' ? 'selected' : ''}>Tools</option>
                                <option value="guidance" ${this.selectedCategory === 'guidance' ? 'selected' : ''}>Guidance</option>
                                <option value="community" ${this.selectedCategory === 'community' ? 'selected' : ''}>Community</option>
                                <option value="official" ${this.selectedCategory === 'official' ? 'selected' : ''}>Official</option>
                                <option value="portfolios" ${this.selectedCategory === 'portfolios' ? 'selected' : ''}>Portfolios</option>
                                <option value="courses" ${this.selectedCategory === 'courses' ? 'selected' : ''}>Courses</option>
                                <option value="capstones" ${this.selectedCategory === 'capstones' ? 'selected' : ''}>Capstones</option>
                                <option value="mentors" ${this.selectedCategory === 'mentors' ? 'selected' : ''}>Mentors</option>
                                <option value="talent" ${this.selectedCategory === 'talent' ? 'selected' : ''}>Talent</option>
                            </select>
                        </div>
                    </div>
                `;

                if (filtered.length === 0) {
                    html += `
                        <div class="cms-empty-state">
                            <i class="fa-solid fa-box-open"></i>
                            <h3>No Resources Found</h3>
                            <p>No resources found for the selected category or search term.</p>
                        </div>
                    `;
                } else {
                    html += `
                        <div class="cms-table-wrapper">
                            <table class="cms-table">
                                <thead>
                                    <tr>
                                        <th>Title & ID</th>
                                        <th>Category</th>
                                        <th>Status</th>
                                        <th>URL</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                    `;

                    filtered.forEach(res => {
                        const tags = Array.isArray(res.tags) ? res.tags : [];
                        const tagsHtml = tags.map(t => `<span class="cms-tag-pill">${t}</span>`).join(' ');

                        html += `
                            <tr>
                                <td>
                                    <div class="cms-table-title">${res.title || 'Untitled'}</div>
                                    <div class="cms-table-slug"><code>${res.id}</code></div>
                                    ${tagsHtml ? `<div class="cms-table-tags">${tagsHtml}</div>` : ''}
                                </td>
                                <td><span class="cms-cat-badge">${res.category}</span></td>
                                <td><span class="cms-status-tag status-${res.status}">${(res.status || 'approved').toUpperCase()}</span></td>
                                <td>
                                    <a href="${res.url || '#'}" target="_blank" class="cms-table-link">
                                        <i class="fa-solid fa-arrow-up-right-from-square"></i> Visit
                                    </a>
                                </td>
                                <td>
                                    <div class="cms-table-actions">
                                        <button class="cms-btn-icon edit" title="Edit Resource" onclick="CMS.openEditResourceModal('${res.id}')">
                                            <i class="fa-solid fa-pen-to-square"></i>
                                        </button>
                                        <button class="cms-btn-icon delete" title="Delete Resource" onclick="CMS.deleteResource('${res.id}')">
                                            <i class="fa-solid fa-trash-can"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `;
                    });

                    html += `</tbody></table></div>`;
                }

                containers.forEach(c => c.innerHTML = html);

            } catch (err) {
                console.error('[CMS] Error loading resources:', err);
                containers.forEach(c => {
                    c.innerHTML = `<div class="cms-error-state"><i class="fa-solid fa-triangle-exclamation"></i> Error loading resources: ${err.message}</div>`;
                });
            }
        },

        handleSearch(val) {
            this.searchTerm = val;
            this.renderResourcesTab();
        },

        handleCategoryFilter(val) {
            this.selectedCategory = val;
            this.renderResourcesTab();
        },

        openAddResourceModal() {
            document.getElementById('resSheetRowId').value = '';
            document.getElementById('resEditId').value = '';
            document.getElementById('resTitle').value = '';
            document.getElementById('resCategory').value = 'materials';
            document.getElementById('resStatus').value = 'approved';
            document.getElementById('resUrl').value = '';
            document.getElementById('resCopyUrl').value = '';
            document.getElementById('resDesc').value = '';
            document.getElementById('resTags').value = '';
            document.getElementById('resSortOrder').value = 0;

            document.getElementById('cmsResourceModalTitle').textContent = 'Add New Resource';
            document.getElementById('resSubmitBtn').textContent = 'Save Resource';

            const subModal = document.getElementById('cmsResourceModal');
            if (subModal) subModal.style.display = 'flex';
        },

        openEditResourceModal(id) {
            const res = this.resourcesCache.find(r => r.id === id);
            if (!res) return;

            document.getElementById('resSheetRowId').value = '';
            document.getElementById('resEditId').value = res.id;
            document.getElementById('resTitle').value = res.title || '';
            document.getElementById('resCategory').value = res.category || 'materials';
            document.getElementById('resStatus').value = res.status || 'approved';
            document.getElementById('resUrl').value = res.url || '';
            document.getElementById('resCopyUrl').value = res.copy_url || res.url || '';
            document.getElementById('resDesc').value = res.description || '';
            document.getElementById('resTags').value = Array.isArray(res.tags) ? res.tags.join(', ') : '';
            document.getElementById('resSortOrder').value = res.sort_order || 0;

            document.getElementById('cmsResourceModalTitle').textContent = `Edit Resource: ${res.title}`;
            document.getElementById('resSubmitBtn').textContent = 'Update Resource';

            const subModal = document.getElementById('cmsResourceModal');
            if (subModal) subModal.style.display = 'flex';
        },

        closeResourceModal() {
            const subModal = document.getElementById('cmsResourceModal');
            if (subModal) subModal.style.display = 'none';
        },

        async handleSaveResource(event) {
            event.preventDefault();

            const editId = document.getElementById('resEditId').value.trim();
            const sheetRowId = document.getElementById('resSheetRowId').value.trim();
            const title = document.getElementById('resTitle').value.trim();
            const category = document.getElementById('resCategory').value;
            const status = document.getElementById('resStatus').value;
            const url = document.getElementById('resUrl').value.trim();
            const copyUrl = document.getElementById('resCopyUrl').value.trim() || url;
            const desc = document.getElementById('resDesc').value.trim();
            const tagsStr = document.getElementById('resTags').value.trim();
            const sortOrder = parseInt(document.getElementById('resSortOrder').value, 10) || 0;

            const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];

            // Auto-generate slug if new
            const slug = editId || `${category}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;

            const payload = {
                id: slug,
                category: category,
                title: title,
                description: desc,
                url: url,
                copy_url: copyUrl,
                tags: tags,
                status: status,
                sort_order: sortOrder,
                updated_at: new Date().toISOString()
            };

            try {
                if (window.supabaseClient) {
                    // Try approve_sheet_submission RPC if approving a Google Sheet row
                    if (sheetRowId) {
                        try {
                            const { error: rpcErr } = await window.supabaseClient.rpc('approve_sheet_submission', {
                                p_sheet_row_id: sheetRowId,
                                p_resource_id: slug,
                                p_category: category,
                                p_title: title,
                                p_url: url,
                                p_description: desc,
                                p_tags: tags
                            });
                            if (rpcErr) throw rpcErr;
                        } catch (rpcErr) {
                            // Direct upsert fallback
                            const { error: resErr } = await window.supabaseClient
                                .from('portal_resources')
                                .upsert(payload, { onConflict: 'id' });
                            if (resErr) throw resErr;

                            await window.supabaseClient
                                .from('portal_sheet_submissions')
                                .update({
                                    status: 'approved',
                                    mapped_resource_id: slug,
                                    admin_notes: `Approved by admin on ${new Date().toLocaleDateString()}`,
                                    updated_at: new Date().toISOString()
                                })
                                .eq('sheet_row_id', sheetRowId);
                        }
                    } else {
                        // Standard resource upsert
                        const { error } = await window.supabaseClient
                            .from('portal_resources')
                            .upsert(payload, { onConflict: 'id' });

                        if (error) throw error;
                    }
                }

                // Update local sheet submission cache if applicable
                if (sheetRowId) {
                    const sheetItem = this.sheetSubmissionsCache.find(s => s.sheet_row_id === sheetRowId);
                    if (sheetItem) {
                        sheetItem.status = 'approved';
                        sheetItem.mapped_resource_id = slug;
                    }
                }

                this.showAlert(`Resource "${title}" successfully saved and published!`, 'success');
                this.closeResourceModal();

                // Invalidate SPA cache for live updates
                if (window.SPA) window.SPA.dataCache = {};

                this.renderResourcesTab();
                if (this.activeTab === 'submissions') {
                    this.renderSubmissionsTab();
                }

            } catch (err) {
                console.error('[CMS] Save resource failed:', err);
                this.showAlert(`Failed to save resource: ${err.message}`, 'error');
            }
        },

        async deleteResource(id) {
            if (!confirm(`Are you sure you want to permanently delete resource "${id}"?`)) return;
            try {
                if (!window.supabaseClient) throw new Error('Supabase not connected');

                const { error } = await window.supabaseClient
                    .from('portal_resources')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                this.showAlert('Resource deleted successfully.', 'success');
                if (window.SPA) window.SPA.dataCache = {};
                this.renderResourcesTab();
            } catch (err) {
                console.error('[CMS] Delete failed:', err);
                this.showAlert(`Delete failed: ${err.message}`, 'error');
            }
        },

        // ======================================================================
        // TAB 3: FEEDBACK INBOX
        // ======================================================================
        async renderFeedbackTab() {
            const containers = this.getActiveContentContainers();
            if (containers.length === 0) return;

            containers.forEach(c => {
                c.innerHTML = `
                    <div class="cms-loader-area">
                        <i class="fa-solid fa-spinner fa-spin"></i>
                        <p>Loading feedback submissions...</p>
                    </div>
                `;
            });

            try {
                let feedbackItems = [];

                // 1. Query portal_sheet_submissions where status = 'feedback'
                if (window.supabaseClient) {
                    const { data: sheetFb } = await window.supabaseClient
                        .from('portal_sheet_submissions')
                        .select('*')
                        .eq('status', 'feedback')
                        .order('sheet_row_number', { ascending: false });

                    if (sheetFb && sheetFb.length > 0) {
                        feedbackItems = sheetFb.map(s => ({
                            id: s.sheet_row_id,
                            submitter_name: s.submitter_name,
                            submitter_email: s.submitter_email,
                            submitter_department: s.department,
                            submitter_batch: s.batch ? `Batch ${s.batch}` : '',
                            title: s.project_title || 'Student Suggestion/Fix',
                            description: s.additional_details || s.project_link,
                            status: 'pending',
                            created_at: s.submitted_at
                        }));
                    }
                }

                // If empty, extract feedback from sheet cache
                if (feedbackItems.length === 0) {
                    const subs = await this.fetchSheetSubmissions();
                    const fbRows = subs.filter(s => s.status === 'feedback');
                    feedbackItems = fbRows.map(s => ({
                        id: s.sheet_row_id,
                        submitter_name: s.submitter_name,
                        submitter_email: s.submitter_email,
                        submitter_department: s.department,
                        submitter_batch: s.batch ? `Batch ${s.batch}` : '',
                        title: s.project_title || 'Student Suggestion/Fix',
                        description: s.additional_details || s.project_link,
                        status: 'pending',
                        created_at: s.submitted_at
                    }));
                }

                this.feedbackCache = feedbackItems;
                this.updateCountBadge('Feedback', feedbackItems.length);

                let html = `
                    <div class="cms-toolbar">
                        <div class="cms-toolbar-left">
                            <span class="cms-section-title"><i class="fa-solid fa-comments"></i> Student Feedback & Reports (${feedbackItems.length})</span>
                            <span class="cms-subtitle-hint">Feedback captured via Google Form and student reports across the portal.</span>
                        </div>
                    </div>
                `;

                if (feedbackItems.length === 0) {
                    html += `
                        <div class="cms-empty-state">
                            <i class="fa-solid fa-comment-dots"></i>
                            <h3>No Feedback Found</h3>
                            <p>No feedback records stored in database. Use <strong>"Sync Google Form"</strong> to parse FEEDBACK entries from the community Google Sheet.</p>
                        </div>
                    `;
                } else {
                    html += `<div class="cms-feedback-list">`;
                    feedbackItems.forEach(fb => {
                        const submitter = fb.submitter_name || 'Anonymous Student';
                        const deptBatch = [fb.submitter_department, fb.submitter_batch].filter(Boolean).join(' • ');

                        html += `
                            <div class="cms-feedback-card status-${fb.status || 'pending'}">
                                <div class="cms-feedback-header">
                                    <div class="cms-feedback-author">
                                        <div class="cms-avatar-mini">${submitter.charAt(0).toUpperCase()}</div>
                                        <div>
                                            <strong>${submitter}</strong>
                                            <span class="cms-feedback-meta">${deptBatch} ${fb.submitter_email ? `• ${fb.submitter_email}` : ''}</span>
                                        </div>
                                    </div>
                                    <div class="cms-feedback-badges">
                                        <span class="cms-status-tag status-${fb.status || 'pending'}">${(fb.status || 'pending').toUpperCase()}</span>
                                    </div>
                                </div>
                                <div class="cms-feedback-body">
                                    <h4>${fb.title || 'Student Feedback'}</h4>
                                    <p>${fb.description || 'No detailed feedback provided.'}</p>
                                </div>
                                <div class="cms-feedback-footer">
                                    <span class="cms-date-text"><i class="fa-solid fa-clock"></i> ${fb.created_at || 'Recent'}</span>
                                    <div class="cms-feedback-actions">
                                        ${fb.status !== 'resolved' ? `
                                            <button class="cms-btn-action approve" onclick="CMS.resolveFeedback('${fb.id}')">
                                                <i class="fa-solid fa-check-double"></i> Mark Resolved
                                            </button>
                                        ` : `
                                            <span class="cms-resolved-label"><i class="fa-solid fa-circle-check"></i> Resolved</span>
                                        `}
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                    html += `</div>`;
                }

                containers.forEach(c => c.innerHTML = html);

            } catch (err) {
                console.error('[CMS] Error loading feedback:', err);
                containers.forEach(c => {
                    c.innerHTML = `<div class="cms-error-state"><i class="fa-solid fa-triangle-exclamation"></i> Error loading feedback: ${err.message}</div>`;
                });
            }
        },

        async resolveFeedback(id) {
            try {
                if (window.supabaseClient) {
                    await window.supabaseClient
                        .from('portal_sheet_submissions')
                        .update({ admin_notes: 'Resolved by admin', updated_at: new Date().toISOString() })
                        .eq('sheet_row_id', id);
                }

                const item = this.feedbackCache.find(f => f.id === id);
                if (item) item.status = 'resolved';

                this.showAlert('Feedback marked as resolved.', 'success');
                this.renderFeedbackTab();
            } catch (err) {
                console.error('[CMS] Resolve feedback failed:', err);
                this.showAlert(`Action failed: ${err.message}`, 'error');
            }
        },

        // ======================================================================
        // TAB 4: ADMIN USER SELECTOR & DELEGATION
        // ======================================================================
        async renderAdminsTab() {
            const containers = this.getActiveContentContainers();
            if (containers.length === 0) return;

            containers.forEach(c => {
                c.innerHTML = `
                    <div class="cms-loader-area">
                        <i class="fa-solid fa-spinner fa-spin"></i>
                        <p>Loading portal student profiles...</p>
                    </div>
                `;
            });

            try {
                let users = [];
                if (window.supabaseClient) {
                    try {
                        const { data, error } = await window.supabaseClient.rpc('get_portal_users');
                        if (!error && data) users = data;
                    } catch (rpcErr) {
                        console.warn('[CMS] get_portal_users RPC unavailable, querying profiles table:', rpcErr);
                    }

                    if (users.length === 0) {
                        const { data, error } = await window.supabaseClient
                            .from('profiles')
                            .select('*')
                            .order('created_at', { ascending: false });

                        if (!error && data) {
                            users = data.map(u => ({
                                id: u.id,
                                email: u.email,
                                student_id: u.student_id,
                                full_name: u.full_name,
                                department: u.department,
                                batch: u.batch,
                                is_portal_admin: !!u.is_portal_admin,
                                created_at: u.created_at
                            }));
                        }
                    }
                }

                this.usersCache = users;
                const adminCount = users.filter(u => u.is_portal_admin).length;
                const memberCount = users.length - adminCount;
                this.updateCountBadge('Admins', adminCount);

                const currentUserId = window.Auth && window.Auth.currentUser ? window.Auth.currentUser.id : null;

                // Apply Search & Role Filter
                let filtered = users;
                if (this.userRoleFilter === 'admins') {
                    filtered = filtered.filter(u => u.is_portal_admin);
                } else if (this.userRoleFilter === 'members') {
                    filtered = filtered.filter(u => !u.is_portal_admin);
                }

                if (this.userSearchTerm) {
                    const term = this.userSearchTerm.toLowerCase();
                    filtered = filtered.filter(u =>
                        (u.full_name && u.full_name.toLowerCase().includes(term)) ||
                        (u.email && u.email.toLowerCase().includes(term)) ||
                        (u.student_id && String(u.student_id).toLowerCase().includes(term)) ||
                        (u.department && u.department.toLowerCase().includes(term)) ||
                        (u.batch && String(u.batch).toLowerCase().includes(term))
                    );
                }

                let html = `
                    <div class="cms-toolbar">
                        <div class="cms-toolbar-left">
                            <span class="cms-section-title"><i class="fa-solid fa-user-shield"></i> Portal Administrator Delegation (${users.length})</span>
                            <span class="cms-subtitle-hint">
                                Delegate portal administrator roles to trusted students or add new students directly to the delegation list.
                            </span>
                        </div>
                        <div class="cms-toolbar-actions">
                            <button class="cms-btn-primary" onclick="CMS.openAddUserModal()">
                                <i class="fa-solid fa-user-plus"></i> Add User
                            </button>
                        </div>
                    </div>

                    <!-- Search & Role Filter Bar -->
                    <div class="cms-filters-bar">
                        <div class="cms-search-box">
                            <i class="fa-solid fa-magnifying-glass"></i>
                            <input type="text" id="cmsUserSearch" placeholder="Search by name, email, or student ID..." 
                                value="${this.userSearchTerm || ''}" oninput="CMS.handleUserSearch(this.value)">
                        </div>
                        <div class="cms-category-select">
                            <select id="cmsUserRoleFilter" onchange="CMS.handleUserRoleFilter(this.value)">
                                <option value="all" ${this.userRoleFilter === 'all' ? 'selected' : ''}>All Roles (${users.length})</option>
                                <option value="admins" ${this.userRoleFilter === 'admins' ? 'selected' : ''}>Administrators Only (${adminCount})</option>
                                <option value="members" ${this.userRoleFilter === 'members' ? 'selected' : ''}>Members Only (${memberCount})</option>
                            </select>
                        </div>
                    </div>
                `;

                if (filtered.length === 0) {
                    html += `
                        <div class="cms-empty-state">
                            <i class="fa-solid fa-users"></i>
                            <h3>No Users Found</h3>
                            <p>${this.userSearchTerm ? `No students match search term "<strong>${this.userSearchTerm}</strong>".` : 'Click <strong>"Add User"</strong> above to register or pre-provision a student for admin delegation.'}</p>
                        </div>
                    `;
                } else {
                    html += `
                        <div class="cms-table-wrapper">
                            <table class="cms-table">
                                <thead>
                                    <tr>
                                        <th>Student / User</th>
                                        <th>Student ID</th>
                                        <th>Department & Batch</th>
                                        <th>Admin Role</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                    `;

                    filtered.forEach(u => {
                        const isSelf = u.id === currentUserId;
                        const displayName = u.full_name || u.email.split('@')[0];
                        const deptBatch = [u.department, u.batch ? `Batch ${u.batch}` : ''].filter(Boolean).join(' • ') || 'Student';

                        html += `
                            <tr>
                                <td>
                                    <div class="cms-user-cell">
                                        <div class="cms-avatar-mini">${displayName.charAt(0).toUpperCase()}</div>
                                        <div>
                                            <strong>${displayName}</strong> ${isSelf ? '<span class="portal-badge-pill" style="font-size: 0.7rem; padding: 1px 6px;">You</span>' : ''}
                                            <div class="cms-user-email">${u.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td><code>${u.student_id || 'Not Set'}</code></td>
                                <td><span class="cms-cat-badge">${deptBatch}</span></td>
                                <td>
                                    ${u.is_portal_admin ? `
                                        <span class="cms-role-badge admin"><i class="fa-solid fa-shield-halved"></i> Administrator</span>
                                    ` : `
                                        <span class="cms-role-badge member"><i class="fa-solid fa-user"></i> Member</span>
                                    `}
                                </td>
                                <td>
                                    <div class="cms-table-actions">
                                        <button class="cms-btn-icon edit" title="Edit Student Profile" onclick="CMS.openEditUserModal('${u.id}')">
                                            <i class="fa-solid fa-user-pen"></i>
                                        </button>
                                        ${u.is_portal_admin ? (
                                            adminCount <= 1 ? `
                                                <button class="cms-btn-action reject disabled" disabled title="Cannot revoke the sole portal administrator. At least one administrator is required.">
                                                    <i class="fa-solid fa-lock"></i> Revoke
                                                </button>
                                            ` : `
                                                <button class="cms-btn-action reject" onclick="CMS.toggleUserAdmin('${u.id}', false, ${isSelf})">
                                                    <i class="fa-solid fa-user-minus"></i> Revoke
                                                </button>
                                            `
                                        ) : `
                                            <button class="cms-btn-action approve" onclick="CMS.toggleUserAdmin('${u.id}', true, false)">
                                                <i class="fa-solid fa-shield-halved"></i> Grant Admin
                                            </button>
                                        `}
                                    </div>
                                </td>
                            </tr>
                        `;
                    });

                    html += `</tbody></table></div>`;
                }

                containers.forEach(c => c.innerHTML = html);

            } catch (err) {
                console.error('[CMS] Error loading users:', err);
                containers.forEach(c => {
                    c.innerHTML = `<div class="cms-error-state"><i class="fa-solid fa-triangle-exclamation"></i> Error loading portal users: ${err.message}</div>`;
                });
            }
        },

        handleUserSearch(val) {
            this.userSearchTerm = val;
            this.renderAdminsTab();
        },

        handleUserRoleFilter(val) {
            this.userRoleFilter = val;
            this.renderAdminsTab();
        },

        openAddUserModal() {
            document.getElementById('userEditId').value = '';
            document.getElementById('userEmail').value = '';
            document.getElementById('userFullName').value = '';
            document.getElementById('userStudentId').value = '';
            document.getElementById('userDepartment').value = 'CSE';
            document.getElementById('userBatch').value = '';
            document.getElementById('userIsAdmin').value = 'false';

            document.getElementById('cmsUserModalTitle').innerHTML = `
                <i class="fa-solid fa-user-plus" style="color: #a855f7;"></i> Add User to Admin Delegation
            `;
            document.getElementById('userSubmitBtn').innerHTML = '<i class="fa-solid fa-user-plus"></i> Add Regular User';

            const modal = document.getElementById('cmsUserModal');
            if (modal) modal.style.display = 'flex';
        },

        openEditUserModal(userId) {
            const user = this.usersCache.find(u => u.id === userId);
            if (!user) return;

            document.getElementById('userEditId').value = user.id;
            document.getElementById('userEmail').value = user.email || '';
            document.getElementById('userFullName').value = user.full_name || '';
            document.getElementById('userStudentId').value = user.student_id || '';
            document.getElementById('userDepartment').value = user.department || '';
            document.getElementById('userBatch').value = user.batch || '';
            document.getElementById('userIsAdmin').value = user.is_portal_admin ? 'true' : 'false';

            document.getElementById('cmsUserModalTitle').innerHTML = `
                <i class="fa-solid fa-user-pen" style="color: #a855f7;"></i> Edit Student Profile
            `;
            document.getElementById('userSubmitBtn').innerHTML = '<i class="fa-solid fa-user-check"></i> Update Profile';

            const modal = document.getElementById('cmsUserModal');
            if (modal) modal.style.display = 'flex';
        },

        closeUserModal() {
            const modal = document.getElementById('cmsUserModal');
            if (modal) modal.style.display = 'none';
        },

        async handleSaveUser(event) {
            event.preventDefault();
            const editId = document.getElementById('userEditId').value.trim();
            const email = document.getElementById('userEmail').value.trim().toLowerCase();
            const fullName = document.getElementById('userFullName').value.trim();
            const studentId = document.getElementById('userStudentId').value.trim();
            const department = document.getElementById('userDepartment').value.trim();
            const batch = document.getElementById('userBatch').value.trim();

            // "Add User to Admin Delegation" adds regular users only (isAdmin = false).
            // When editing an existing user, preserve their existing admin status.
            const isAdmin = editId ? (document.getElementById('userIsAdmin').value === 'true') : false;

            if (!email) {
                alert('Please enter a valid email address.');
                return;
            }

            try {
                if (window.supabaseClient) {
                    let rpcDone = false;
                    // Try add_or_grant_portal_user RPC first
                    try {
                        const { data, error: rpcErr } = await window.supabaseClient.rpc('add_or_grant_portal_user', {
                            p_email: email,
                            p_full_name: fullName,
                            p_student_id: studentId,
                            p_department: department,
                            p_batch: batch,
                            p_is_admin: isAdmin
                        });
                        if (!rpcErr) rpcDone = true;
                    } catch (rpcErr) {
                        console.warn('[CMS] add_or_grant_portal_user RPC error, using direct table operations:', rpcErr);
                    }

                    if (!rpcDone) {
                        // Check if user exists by email
                        const { data: existingUser } = await window.supabaseClient
                            .from('profiles')
                            .select('*')
                            .eq('email', email)
                            .maybeSingle();

                        if (existingUser) {
                            const curTags = Array.isArray(existingUser.project_tags) ? existingUser.project_tags : [];
                            const newTags = curTags.includes('portal') ? curTags : [...curTags, 'portal'];

                            const { error: updErr } = await window.supabaseClient
                                .from('profiles')
                                .update({
                                    full_name: fullName || existingUser.full_name,
                                    student_id: studentId || existingUser.student_id,
                                    department: department || existingUser.department,
                                    batch: batch || existingUser.batch,
                                    is_portal_admin: isAdmin,
                                    project_tags: newTags,
                                    updated_at: new Date().toISOString()
                                })
                                .eq('id', existingUser.id);

                            if (updErr) throw updErr;
                        } else {
                            // Insert pre-provisioned user profile
                            const newId = editId || (window.crypto?.randomUUID ? window.crypto.randomUUID() : 'user-' + Date.now());
                            const { error: insErr } = await window.supabaseClient
                                .from('profiles')
                                .insert([{
                                    id: newId,
                                    email: email,
                                    full_name: fullName,
                                    student_id: studentId,
                                    department: department,
                                    batch: batch,
                                    is_portal_admin: isAdmin,
                                    project_tags: ['portal'],
                                    created_at: new Date().toISOString(),
                                    updated_at: new Date().toISOString()
                                }]);

                            if (insErr) throw insErr;
                        }
                    }
                }

                this.showAlert(`User "${email}" successfully ${editId ? 'updated' : 'added to portal as regular member'}!`, 'success');
                this.closeUserModal();
                this.renderAdminsTab();

            } catch (err) {
                console.error('[CMS] Save user failed:', err);
                this.showAlert(`Failed to save user: ${err.message}`, 'error');
            }
        },

        async toggleUserAdmin(userId, grantAdmin, isSelf) {
            if (!grantAdmin) {
                const adminCount = (this.usersCache || []).filter(u => u.is_portal_admin).length;
                if (adminCount <= 1) {
                    this.showAlert('Cannot revoke the sole portal administrator. At least one administrator is required.', 'error');
                    return;
                }
            }

            if (isSelf && !grantAdmin) {
                if (!confirm('WARNING: You are about to revoke your OWN administrator privileges! You will lose access to the CMS immediately upon reload. Are you sure?')) {
                    return;
                }
            }

            try {
                if (!window.supabaseClient) throw new Error('Supabase client not initialized');

                // Try RPC set_portal_admin first
                const { error: rpcErr } = await window.supabaseClient.rpc('set_portal_admin', {
                    target_user_id: userId,
                    grant_admin: grantAdmin
                });

                if (rpcErr) {
                    // Fallback to direct profiles table update
                    const { error: updErr } = await window.supabaseClient
                        .from('profiles')
                        .update({ is_portal_admin: grantAdmin, updated_at: new Date().toISOString() })
                        .eq('id', userId);

                    if (updErr) throw updErr;
                }

                this.showAlert(`Admin status successfully ${grantAdmin ? 'granted' : 'revoked'}.`, 'success');

                // If updated self, update local state
                if (isSelf && window.Auth && window.Auth.currentUser) {
                    window.Auth.currentUser.isPortalAdmin = grantAdmin;
                    this.updateUI();
                }

                this.renderAdminsTab();
            } catch (err) {
                console.error('[CMS] Admin toggle failed:', err);
                this.showAlert(`Failed to update admin role: ${err.message}`, 'error');
                this.renderAdminsTab();
            }
        },

        // ======================================================================
        // GOOGLE SHEET SYNC HELPER
        // ======================================================================
        async syncFromGoogleSheet() {
            const btns = [
                document.getElementById('cmsSyncSheetBtn'),
                document.getElementById('cmsPageSyncSheetBtn')
            ].filter(Boolean);

            btns.forEach(btn => {
                btn.disabled = true;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Syncing...';
            });

            const SHEET_ID = '1oQ5Mkavjm62UGZwNjM-52yvKppWZHfX-Qpq6jtEVIOY';
            const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

            try {
                const response = await fetch(SHEET_URL);
                if (!response.ok) throw new Error('Could not fetch Google Sheet data');
                const text = await response.text();

                if (!text.includes('google.visualization.Query.setResponse')) {
                    throw new Error('Google Sheet response format is invalid or sheet not published');
                }

                const jsonString = text.substring(text.indexOf('(') + 1, text.lastIndexOf(')'));
                const gData = JSON.parse(jsonString);

                const rows = gData.table?.rows || [];
                let syncedCount = 0;
                let pendingCount = 0;
                let alreadyCount = 0;

                // Load existing catalog resources for cross-reference
                let existingCatalog = [];
                if (window.supabaseClient) {
                    const { data: resData } = await window.supabaseClient.from('portal_resources').select('id, title, url');
                    if (resData) existingCatalog = resData;
                }

                const knownMappings = {
                    2: 'tools-handgesture',
                    3: 'courses-dsa1-robiul',
                    4: 'portfolio-chatokjnr',
                    5: 'portfolio-atikshahria',
                    6: 'courses-cg-Arriesgado47',
                    7: 'portfolio-#',
                    8: 'capstone-research-archive',
                    9: 'guidance-research-pub',
                    10: 'courses-cg-4xrhd',
                    11: 'courses-all-4xrhd',
                    13: 'guidance-research-pub'
                };

                const recordsToUpsert = [];

                rows.forEach((row, idx) => {
                    const rowNum = idx + 2;
                    const sheetRowId = `sheet_row_${rowNum}`;
                    const c = row.c || [];
                    const time = c[0] ? (c[0].f || c[0].v || '') : '';
                    const email = c[1]?.v ? String(c[1].v).trim() : '';
                    const studentId = c[2]?.v ? String(c[2].v).trim() : '';
                    const submissionFor = c[3]?.v ? String(c[3].v).trim() : '';
                    const name = c[4]?.v ? String(c[4].v).trim() : '';
                    const social = c[5]?.v ? String(c[5].v).trim() : '';
                    const projectTitle = c[6]?.v ? String(c[6].v).trim() : '';
                    const projectLink = c[7]?.v ? String(c[7].v).trim() : '';
                    const projectType = c[8]?.v ? String(c[8].v).trim() : '';
                    const expertise = c[9]?.v ? String(c[9].v).trim() : '';
                    const department = c[10]?.v ? String(c[10].v).trim() : '';
                    const batch = c[11]?.v ? String(c[11].v).trim() : '';
                    const details = c[12]?.v ? String(c[12].v).trim() : '';

                    if (!name || name.toLowerCase() === 'your name') return;

                    const isFeedback = (projectType && projectType.toUpperCase().includes('FEEDBACK')) ||
                                       (submissionFor && submissionFor.toUpperCase().includes('FEEDBACK'));

                    let status = 'pending';
                    let mappedId = null;

                    if (isFeedback) {
                        status = 'feedback';
                    } else if (knownMappings[rowNum]) {
                        status = 'already_added';
                        mappedId = knownMappings[rowNum];
                        alreadyCount++;
                    } else {
                        // Check match in existing catalog
                        const matched = existingCatalog.find(item => {
                            if (projectLink && item.url && (item.url.toLowerCase() === projectLink.toLowerCase() || item.url.includes(projectLink) || projectLink.includes(item.url))) return true;
                            if (projectTitle && item.title && item.title.toLowerCase().includes(projectTitle.toLowerCase())) return true;
                            return false;
                        });

                        if (matched) {
                            status = 'already_added';
                            mappedId = matched.id;
                            alreadyCount++;
                        } else {
                            status = 'pending';
                            pendingCount++;
                        }
                    }

                    recordsToUpsert.push({
                        sheet_row_id: sheetRowId,
                        sheet_row_number: rowNum,
                        submitted_at: time,
                        submitter_email: email,
                        student_id: studentId,
                        submission_for: submissionFor,
                        submitter_name: name,
                        submitter_social: social,
                        project_title: projectTitle,
                        project_link: projectLink,
                        project_type: projectType,
                        portfolio_expertise: expertise,
                        department: department,
                        batch: batch,
                        additional_details: details,
                        status: status,
                        mapped_resource_id: mappedId,
                        updated_at: new Date().toISOString()
                    });

                    syncedCount++;
                });

                // Upsert to Supabase if connected
                if (window.supabaseClient && recordsToUpsert.length > 0) {
                    try {
                        const { error } = await window.supabaseClient
                            .from('portal_sheet_submissions')
                            .upsert(recordsToUpsert, { onConflict: 'sheet_row_id' });

                        if (error) console.warn('[CMS] Upsert to portal_sheet_submissions warning:', error);
                    } catch (dbErr) {
                        console.warn('[CMS] Supabase upsert error:', dbErr);
                    }
                }

                // Update local memory cache
                this.sheetSubmissionsCache = recordsToUpsert.sort((a, b) => b.sheet_row_number - a.sheet_row_number);

                this.showAlert(`Google Sheet Sync Complete! Synced ${syncedCount} entries (${pendingCount} needing approval, ${alreadyCount} already on website).`, 'success');
                this.renderSubmissionsTab();

            } catch (err) {
                console.error('[CMS] Google Sheet Sync error:', err);
                this.showAlert(`Sync failed: ${err.message}`, 'error');
            } finally {
                btns.forEach(btn => {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> Sync Google Form';
                });
            }
        }
    };

    // Expose to window
    window.CMS = CMS;

    // Initialize on DOM load
    document.addEventListener('DOMContentLoaded', () => {
        CMS.init();
    });
})();
