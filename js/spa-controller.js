// oU1TS Portal SPA Controller
// Manages hash-based routing, views, transitions, playful floating bubbles navigation, and new dynamic sections.

(function () {
    const SPA = {
        routes: {
            '': { viewId: 'homeView', title: 'oU1TS Portal - Academic Project Hub' },
            'materials': { viewId: 'materialsView', title: 'Materials - oU1TS Portal', pageType: 'materials' },
            'tools': { viewId: 'toolsView', title: 'Tools - oU1TS Portal', pageType: 'tools' },
            'guidance': { viewId: 'guidanceView', title: 'Guidance - oU1TS Portal', pageType: 'guidance' },
            'community': { viewId: 'communityView', title: 'Community - oU1TS Portal', pageType: 'community' },
            'courses': { viewId: 'coursesView', title: 'Course Repositories - oU1TS Portal', pageType: 'courses' },
            'portfolios': { viewId: 'portfoliosView', title: 'Portfolios - oU1TS Portal', pageType: 'portfolios' },
            'official': { viewId: 'officialView', title: 'Official UITS - oU1TS Portal', pageType: 'official' },
            'inspirations': { viewId: 'inspirationsView', title: 'Inspirations - oU1TS Portal', pageType: 'inspirations' },
            'profile': { viewId: 'profileView', title: 'User Profile - oU1TS Portal', pageType: 'profile' },
            'capstones': { viewId: 'capstonesView', title: 'Capstone Projects - oU1TS Portal', pageType: 'capstones' },
            'mentors': { viewId: 'mentorsView', title: 'Industry Mentors - oU1TS Portal', pageType: 'mentors' },
            'talent': { viewId: 'talentView', title: 'Talent Directory - oU1TS Portal', pageType: 'talent' }
        },
        
        currentRoute: '',
        dataCache: {},

        init() {
            // Setup hash listener
            window.addEventListener('hashchange', () => this.handleRouting());
            
            // Listen for window resize to reposition bubbles
            window.addEventListener('resize', this.debounce(() => {
                if (!document.body.classList.contains('in-subview')) {
                    this.positionFloatingBubbles();
                }
            }, 250));

            // Trigger initial routing
            this.handleRouting();
            
            // Initialize bubbles layout on load
            setTimeout(() => {
                this.positionFloatingBubbles();
            }, 300);
        },

        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        async handleRouting() {
            const rawHash = window.location.hash;
            let routeKey = rawHash.replace('#', '');
            
            // Check if route exists, if not fallback to home
            if (!this.routes[routeKey]) {
                routeKey = '';
            }

            this.currentRoute = routeKey;
            const route = this.routes[routeKey];
            
            // Update document title
            document.title = route.title;

            // Toggle body class
            if (routeKey === '') {
                document.body.classList.remove('in-subview');
            } else {
                document.body.classList.add('in-subview');
            }

            // Hide all sub-views and show active
            const views = document.querySelectorAll('.spa-view');
            views.forEach(v => {
                v.classList.remove('active-view');
            });

            const activeView = document.getElementById(route.viewId);
            if (activeView) {
                activeView.classList.add('active-view');
                // Scroll to top of view
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }

            // Load data and render
            if (route.pageType) {
                await this.loadAndRenderView(route.pageType);
            } else {
                // Return to home, make sure bubbles are positioned properly
                this.positionFloatingBubbles();
            }

            // Always close sidebar on view change (mobile layout)
            if (typeof closeMobileMenu === 'function') {
                closeMobileMenu();
            }
        },

        async loadAndRenderView(pageType) {
            try {
                // Show loading states in active containers
                this.showLoadingState(pageType);

                let data = this.dataCache[pageType];
                if (!data) {
                    const response = await fetch(`json/${pageType}.json`);
                    if (!response.ok) throw new Error(`HTTP error fetching ${pageType}`);
                    data = await response.json();
                    this.dataCache[pageType] = data; // Cache results
                }

                // Render respective view content
                if (pageType === 'profile') {
                    this.renderProfileView();
                } else if (pageType === 'capstones') {
                    this.renderCapstonesView(data);
                } else if (pageType === 'mentors') {
                    this.renderMentorsView(data);
                } else if (pageType === 'talent') {
                    this.renderTalentView(data);
                } else if (typeof window.DataRenderer !== 'undefined') {
                    // Standard categories rendered by centralized DataRenderer module
                    window.DataRenderer.render(pageType, data);
                    // Initialize stars for category
                    setTimeout(() => {
                        if (window.Stars) Stars.init(pageType);
                    }, 100);
                }
            } catch (err) {
                console.error(`Error loading SPA view [${pageType}]:`, err);
                this.showErrorState(pageType, err.message);
            }
        },

        showLoadingState(pageType) {
            const view = document.getElementById(`${pageType}View`);
            if (!view) return;
            const container = view.querySelector('.project-list, .course-list, .inspirations-list, .profile-details-area, .capstone-gallery, .mentor-directory-grid, .talent-list');
            if (container) {
                container.innerHTML = `<div class="loading-state" style="text-align:center; padding: 3rem; color: #a0a0a0;"><i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; color: #64b5f6; margin-bottom: 1rem;"></i><p>Loading entries...</p></div>`;
            }
        },

        showErrorState(pageType, msg) {
            const view = document.getElementById(`${pageType}View`);
            if (!view) return;
            const container = view.querySelector('.project-list, .course-list, .inspirations-list, .profile-details-area, .capstone-gallery, .mentor-directory-grid, .talent-list');
            if (container) {
                container.innerHTML = `<div class="error-state" style="text-align:center; padding: 3rem; color: #f44336;"><i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem; margin-bottom: 1rem;"></i><p>Failed to load data: ${msg}</p></div>`;
            }
        },

        // --- PLAYFUL FLOATING BUBBLES ALGORITHM ---
        positionFloatingBubbles() {
            const canvas = document.getElementById('floatingCanvas');
            if (!canvas) return;

            const bubbles = canvas.querySelectorAll('.floating-bubble');
            const numBubbles = bubbles.length;
            if (numBubbles === 0) return;

            const canvasWidth = canvas.offsetWidth;
            const canvasHeight = canvas.offsetHeight;

            // Dimensions of bubble (diameter 110px) plus safety padding
            const bubbleSize = 110;
            const radius = bubbleSize / 2;
            const minDistance = bubbleSize + 25; // Center-to-center minimum distance (135px)

            const placedPositions = [];

            bubbles.forEach((bubble, index) => {
                let left = 0;
                let top = 0;
                let overlap = true;
                let attempts = 0;
                let currentMinDistance = minDistance;

                // Staggered animation classes
                const animIndex = (index % 4) + 1; // float1, float2, float3, float4
                bubble.style.animation = `float${animIndex} ${6 + index % 5}s ease-in-out infinite`;
                bubble.style.animationDelay = `${index * -0.6}s`;

                // Calculate random positions with collision-detection loop
                while (overlap && attempts < 250) {
                    // Stay within canvas margins (5% to 85%)
                    const pctLeft = 5 + Math.random() * 80;
                    const pctTop = 5 + Math.random() * 80;

                    // Convert to pixels for exact distance calculation
                    left = (pctLeft / 100) * canvasWidth;
                    top = (pctTop / 100) * canvasHeight;

                    // Keep bubble centers within boundaries
                    if (left < radius) left = radius;
                    if (left > canvasWidth - radius) left = canvasWidth - radius;
                    if (top < radius) top = radius;
                    if (top > canvasHeight - radius) top = canvasHeight - radius;

                    // Check for overlaps with already placed bubbles
                    overlap = false;
                    for (let i = 0; i < placedPositions.length; i++) {
                        const other = placedPositions[i];
                        const dx = left - other.x;
                        const dy = top - other.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);

                        if (dist < currentMinDistance) {
                            overlap = true;
                            break;
                        }
                    }

                    // Ease safety constraints on tight screens/high attempts
                    if (overlap && attempts > 100) {
                        currentMinDistance = Math.max(80, currentMinDistance - 5);
                    }

                    attempts++;
                }

                // Keep positioning details
                placedPositions.push({ x: left, y: top });

                // Position absolutely using percentages for responsive stretching
                bubble.style.left = `${((left - radius) / canvasWidth) * 100}%`;
                bubble.style.top = `${((top - radius) / canvasHeight) * 100}%`;
            });
        },

        // --- NEW SECTION 1: USER PROFILE VIEW ---
        renderProfileView() {
            const container = document.getElementById('profileDetailsArea');
            const unauthForm = document.getElementById('profileUnauthForm');
            if (!container || !unauthForm) return;

            const auth = window.Auth;
            if (auth && auth.isLoggedIn()) {
                // Logged In Dashboard View
                unauthForm.style.display = 'none';
                container.style.display = 'grid';

                const user = auth.currentUser;
                const studentIdStr = user.studentId || 'Not Set';
                const firstLetter = (user.email || 'U').charAt(0).toUpperCase();

                // Compute Contribution Count (mock based on student email length/id etc)
                const mockContributions = Math.max(1, (user.email.length % 5) + 1);

                container.innerHTML = `
                    <div class="profile-card">
                        <div class="profile-avatar-container">${firstLetter}</div>
                        <h3 class="profile-name">${user.email.split('@')[0]}</h3>
                        <span class="profile-student-id">ID: ${studentIdStr}</span>
                        
                        <div class="profile-meta-info">
                            <p><strong>Email:</strong> ${user.email}</p>
                            <p><strong>Status:</strong> Active Student</p>
                            <p><strong>Joined:</strong> Feb 2026</p>
                        </div>
                    </div>
                    
                    <div class="profile-details-area">
                        <div class="profile-stats-grid">
                            <div class="stat-card">
                                <div class="stat-number" id="profileStarredCount">0</div>
                                <div class="stat-label">Starred Resources</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number">${mockContributions}</div>
                                <div class="stat-label">Contributions</div>
                            </div>
                        </div>
                        
                        <div class="my-starred-list">
                            <h3>My Starred Resources</h3>
                            <div class="starred-items-container" id="myStarredItems">
                                <div style="color: #a0a0a0; font-size: 0.85rem; padding: 1rem; text-align: center;">No starred resources yet. Star resources to see them here!</div>
                            </div>
                        </div>
                    </div>
                `;

                this.loadUserStarredList();

            } else {
                // Logged Out Connection Form View
                container.style.display = 'none';
                unauthForm.style.display = 'block';
                this.setupProfileTabs();
            }
        },

        setupProfileTabs() {
            const tabs = document.querySelectorAll('.profile-auth-tab');
            const loginForm = document.getElementById('profileLoginForm');
            const registerForm = document.getElementById('profileRegisterForm');

            tabs.forEach(tab => {
                tab.onclick = () => {
                    tabs.forEach(t => t.classList.remove('active-tab'));
                    tab.classList.add('active-tab');

                    const action = tab.dataset.action;
                    if (action === 'login') {
                        loginForm.style.display = 'block';
                        registerForm.style.display = 'none';
                    } else {
                        loginForm.style.display = 'none';
                        registerForm.style.display = 'block';
                    }
                };
            });
        },

        async loadUserStarredList() {
            const starredContainer = document.getElementById('myStarredItems');
            const starredCountEl = document.getElementById('profileStarredCount');
            if (!starredContainer) return;

            const auth = window.Auth;
            const supabase = window.supabaseClient;
            if (!auth || !auth.currentUser) return;

            try {
                let userStars = [];
                if (supabase) {
                    const { data, error } = await supabase
                        .from('stars')
                        .select('resource_type, resource_id')
                        .eq('user_id', auth.currentUser.id);
                    
                    if (error) throw error;
                    userStars = data || [];
                } else {
                    // Local fallback stars
                    const key = `local_stars_${auth.currentUser.id}`;
                    const localStarsStr = localStorage.getItem(key);
                    userStars = localStarsStr ? JSON.parse(localStarsStr) : [];
                }

                if (starredCountEl) starredCountEl.textContent = userStars.length;

                if (userStars.length === 0) {
                    starredContainer.innerHTML = `<div style="color: #a0a0a0; font-size: 0.85rem; padding: 1rem; text-align: center;">No starred resources yet.</div>`;
                    return;
                }

                // Render list
                starredContainer.innerHTML = '';
                userStars.forEach(star => {
                    const item = document.createElement('div');
                    item.className = 'my-starred-item';
                    item.innerHTML = `
                        <div class="starred-item-info">
                            <span class="starred-item-title">${this.formatResourceTitle(star.resource_id)}</span>
                            <span class="starred-item-type">${star.resource_type}</span>
                        </div>
                        <div class="starred-item-actions">
                            <a href="#${star.resource_type}" title="View details"><i class="fa-solid fa-arrow-right-to-bracket"></i></a>
                            <button onclick="window.SPA.removeProfileStar('${star.resource_type}', '${star.resource_id}')" title="Unstar"><i class="fa-solid fa-trash-can"></i></button>
                        </div>
                    `;
                    starredContainer.appendChild(item);
                });

            } catch (err) {
                console.error('Error fetching profile stars:', err);
                starredContainer.innerHTML = `<div style="color: #f44336; font-size: 0.85rem; padding: 1rem; text-align: center;">Error loading starred resources.</div>`;
            }
        },

        formatResourceTitle(resourceId) {
            // Converts 'materials-uitsbot' -> 'UITS Bot', etc.
            const parts = resourceId.split('-');
            if (parts.length > 1) {
                parts.shift(); // Remove prefix
            }
            return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        },

        async removeProfileStar(type, resourceId) {
            if (!confirm('Are you sure you want to unstar this resource?')) return;
            try {
                // We mock toggle star using the active Stars module or fallback
                if (window.Stars) {
                    // We temporarily mock resourceType on Stars and trigger unstar
                    const originalType = window.Stars.resourceType;
                    window.Stars.resourceType = type;
                    await window.Stars.toggleStar(resourceId);
                    window.Stars.resourceType = originalType;
                } else {
                    // fallback local database
                    const auth = window.Auth;
                    if (auth && auth.currentUser) {
                        const key = `local_stars_${auth.currentUser.id}`;
                        let localStars = JSON.parse(localStorage.getItem(key) || '[]');
                        localStars = localStars.filter(s => !(s.resource_id === resourceId && s.resource_type === type));
                        localStorage.setItem(key, JSON.stringify(localStars));
                    }
                }
                // Reload list
                this.loadUserStarredList();
            } catch (error) {
                console.error('Failed to remove star:', error);
            }
        },

        // --- NEW SECTION 2: CAPSTONE PROJECTS ---
        renderCapstonesView(projects) {
            const gallery = document.getElementById('capstoneGallery');
            const spotlight = document.getElementById('capstoneSpotlight');
            if (!gallery || !spotlight || projects.length === 0) return;

            // 1. Render Spotlight Highlight Project (random select on view activation)
            const randomIndex = Math.floor(Math.random() * projects.length);
            const spot = projects[randomIndex];
            
            // Build stack tags
            const stackHtml = spot.tags.map(t => `<span class="expertise-tag">${t}</span>`).join('');
            const teamNames = spot.team.join(', ');

            spotlight.innerHTML = `
                <div class="spotlight-badge"><i class="fa-solid fa-award"></i> Central Highlight Project</div>
                <h2 class="spotlight-title">${spot.title}</h2>
                <p class="spotlight-desc">${spot.description}</p>
                <div class="spotlight-meta">
                    <span class="spotlight-meta-item"><strong>Team:</strong> ${teamNames}</span>
                    <span class="spotlight-meta-item"><strong>Batch:</strong> ${spot.batch}</span>
                    <span class="spotlight-meta-item"><strong>Semester:</strong> ${spot.semester}</span>
                </div>
                <div style="display:flex; gap: 1rem; align-items:center;">
                    <a href="${spot.visitUrl}" target="_blank" class="visit-btn" style="padding: 0.75rem 1.5rem; font-size: 0.95rem;">
                        Visit Showcase <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    </a>
                    <div style="display:flex; gap:0.4rem; align-items:center;">
                        ${stackHtml}
                    </div>
                </div>
            `;

            // 2. Render Gallery Batch-wise lists
            // Group by batch
            const batches = {};
            projects.forEach(p => {
                if (!batches[p.batch]) batches[p.batch] = [];
                batches[p.batch].push(p);
            });

            gallery.innerHTML = '';
            
            // Sort batch keys descending (e.g. Batch 52, Batch 51)
            const sortedBatches = Object.keys(batches).sort((a, b) => b.localeCompare(a));

            sortedBatches.forEach((batchName, bIndex) => {
                const batchProjects = batches[batchName];
                const accordion = document.createElement('div');
                accordion.className = `batch-accordion ${bIndex === 0 ? 'active-batch' : ''}`;

                const cardsHtml = batchProjects.map(proj => {
                    const projTags = proj.tags.map(t => `<span class="talent-skill">${t}</span>`).join('');
                    const members = proj.team.join(', ');
                    return `
                        <div class="capstone-card" data-resource-id="${proj.id}">
                            <div>
                                <h3 class="capstone-card-title">${proj.title}</h3>
                                <p class="capstone-card-desc">${proj.description}</p>
                                <div class="talent-skills" style="margin-bottom:1rem;">
                                    ${projTags}
                                </div>
                            </div>
                            <div class="capstone-card-footer">
                                <span class="capstone-team-text"><i class="fa-solid fa-users"></i> ${members}</span>
                                <a href="${proj.visitUrl}" target="_blank" class="visit-btn" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;">
                                    Demo <i class="fa-solid fa-arrow-up-right-from-square"></i>
                                </a>
                            </div>
                        </div>
                    `;
                }).join('');

                accordion.innerHTML = `
                    <button class="batch-header" onclick="window.SPA.toggleBatchAccordion(this)">
                        <span><i class="fa-solid fa-folder-open"></i> ${batchName} (${batchProjects.length} Projects)</span>
                        <i class="fa-solid fa-chevron-down"></i>
                    </button>
                    <div class="batch-content">
                        <div class="capstone-grid">
                            ${cardsHtml}
                        </div>
                    </div>
                `;

                gallery.appendChild(accordion);
            });
        },

        toggleBatchAccordion(button) {
            const accordion = button.closest('.batch-accordion');
            if (accordion) {
                accordion.classList.toggle('active-batch');
            }
        },

        // --- NEW SECTION 3: INDUSTRY MENTORS ---
        renderMentorsView(mentors) {
            const track = document.getElementById('mentorsCarouselTrack');
            const directory = document.getElementById('mentorsDirectoryGrid');
            if (!track || !directory || mentors.length === 0) return;

            // 1. Top Half: Featured Seniors Row (sorted by stars rating)
            const sortedFeatured = [...mentors].sort((a, b) => b.stars - a.stars);
            track.innerHTML = '';
            
            sortedFeatured.forEach(mentor => {
                const initial = mentor.name.charAt(0).toUpperCase();
                const starsHtml = '<i class="fa-solid fa-star"></i>'.repeat(mentor.stars);
                track.innerHTML += `
                    <div class="mentor-card-featured">
                        <div class="mentor-featured-badge"><i class="fa-solid fa-bolt"></i> Senior</div>
                        <div class="mentor-avatar">${initial}</div>
                        <h4 class="mentor-name">${mentor.name}</h4>
                        <div class="mentor-role">${mentor.role}</div>
                        <div class="mentor-company">at ${mentor.company}</div>
                        <div class="mentor-star-rating" title="${mentor.stars} Stars ranking">
                            ${starsHtml}
                        </div>
                        <a href="mailto:${mentor.email}?subject=Mentorship Request from oU1TS Portal" class="mentor-reachout-btn">
                            Request Mentorship
                        </a>
                    </div>
                `;
            });

            // 2. Bottom Half: Alumni Directory list
            directory.innerHTML = '';
            mentors.forEach(mentor => {
                const initial = mentor.name.charAt(0).toUpperCase();
                const skillTags = mentor.skills.map(s => `<span class="expertise-tag">${s}</span>`).join('');
                
                directory.innerHTML += `
                    <div class="mentor-card-dir">
                        <div class="mentor-avatar" style="width:50px; height:50px; font-size:1.3rem; margin:0; flex-shrink:0;">${initial}</div>
                        <div class="mentor-card-dir-info">
                            <h4>${mentor.name}</h4>
                            <p>${mentor.title} at <strong>${mentor.company}</strong> (${mentor.batch})</p>
                            <p style="color:#777; font-size: 0.72rem; margin-bottom: 0.4rem;">${mentor.experience}</p>
                            <div class="expertise-tags">
                                ${skillTags}
                            </div>
                        </div>
                        <div class="mentor-dir-actions">
                            <a href="${mentor.socials.linkedin}" target="_blank" class="mentor-dir-icon-btn" title="LinkedIn Profile">
                                <i class="fa-brands fa-linkedin-in"></i>
                            </a>
                            <a href="${mentor.socials.github}" target="_blank" class="mentor-dir-icon-btn" title="GitHub Profile">
                                <i class="fa-brands fa-github"></i>
                            </a>
                            <a href="${mentor.socials.telegram}" target="_blank" class="mentor-dir-icon-btn" title="Telegram DM">
                                <i class="fa-brands fa-telegram"></i>
                            </a>
                        </div>
                    </div>
                `;
            });
        },

        // --- NEW SECTION 4: HIRE US TALENT DIRECTORY ---
        renderTalentView(talents) {
            const list = document.getElementById('talentList');
            const filterBar = document.getElementById('talentFilterBar');
            if (!list || !filterBar || talents.length === 0) return;

            // 1. Render Category Filter tag links
            // Extract sectors
            const sectors = ['All'];
            talents.forEach(t => {
                if (!sectors.includes(t.sector)) sectors.push(t.sector);
            });

            filterBar.innerHTML = '';
            sectors.forEach(sector => {
                const button = document.createElement('button');
                button.className = `filter-tag ${sector === 'All' ? 'active-tag' : ''}`;
                button.textContent = sector;
                button.dataset.sector = sector;
                
                button.onclick = () => {
                    filterBar.querySelectorAll('.filter-tag').forEach(b => b.classList.remove('active-tag'));
                    button.classList.add('active-tag');
                    this.filterTalentRows(sector, talents);
                };

                filterBar.appendChild(button);
            });

            // 2. Render rows (All by default)
            this.filterTalentRows('All', talents);
        },

        filterTalentRows(selectedSector, talents) {
            const list = document.getElementById('talentList');
            if (!list) return;

            const filtered = selectedSector === 'All' 
                ? talents 
                : talents.filter(t => t.sector === selectedSector);

            list.innerHTML = '';
            if (filtered.length === 0) {
                list.innerHTML = `<div style="text-align:center; padding: 2rem; color:#a0a0a0;">No candidates matching this criteria.</div>`;
                return;
            }

            filtered.forEach(student => {
                const initial = student.name.charAt(0).toUpperCase();
                const skillTags = student.skills.map(s => `<span class="talent-skill">${s}</span>`).join('');

                const row = document.createElement('div');
                row.className = 'talent-row';
                row.innerHTML = `
                    <div class="talent-profile">
                        <div class="talent-avatar">${initial}</div>
                        <div class="talent-meta">
                            <h4>${student.name}</h4>
                            <span>${student.role}</span>
                        </div>
                    </div>
                    <div class="talent-bio-stack">
                        <p class="talent-bio">${student.bio}</p>
                        <div class="talent-skills">
                            ${skillTags}
                        </div>
                    </div>
                    <div class="talent-action">
                        <button class="talent-hire-btn" onclick="window.SPA.openHireModal('${student.id}')">
                            Hire Us <i class="fa-solid fa-paper-plane"></i>
                        </button>
                    </div>
                `;
                list.appendChild(row);
            });
        },

        openHireModal(studentId) {
            const talents = this.dataCache['talent'];
            if (!talents) return;

            const student = talents.find(t => t.id === studentId);
            if (!student) return;

            const overlay = document.getElementById('hireModalOverlay');
            if (!overlay) return;

            const initial = student.name.charAt(0).toUpperCase();
            
            overlay.innerHTML = `
                <div class="hire-modal-container">
                    <button class="hire-modal-close" onclick="window.SPA.closeHireModal()">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                    <div class="hire-modal-header">
                        <div class="hire-modal-avatar">${initial}</div>
                        <h3 class="hire-modal-title">Contact ${student.name}</h3>
                        <span class="hire-modal-role">${student.role}</span>
                    </div>
                    <div class="hire-modal-body">
                        <p>Initiate contact with ${student.name} for technical interviews, internships, or collaboration opportunities using their preferred networks below.</p>
                        
                        <div class="hire-social-grid">
                            <a href="${student.socials.linkedin}" target="_blank" class="hire-social-btn btn-linkedin">
                                <i class="fa-brands fa-linkedin-in"></i> LinkedIn
                            </a>
                            <a href="${student.socials.github}" target="_blank" class="hire-social-btn btn-github">
                                <i class="fa-brands fa-github"></i> GitHub
                            </a>
                            <a href="${student.socials.telegram}" target="_blank" class="hire-social-btn btn-telegram">
                                <i class="fa-brands fa-telegram"></i> Telegram
                            </a>
                            <a href="mailto:${student.socials.email}?subject=Interview Invitation: oU1TS Talent Directory" class="hire-social-btn btn-email">
                                <i class="fa-solid fa-envelope"></i> Email
                            </a>
                        </div>
                    </div>
                </div>
            `;

            overlay.classList.add('active-modal');
            document.body.style.overflow = 'hidden';
        },

        closeHireModal() {
            const overlay = document.getElementById('hireModalOverlay');
            if (overlay) {
                overlay.classList.remove('active-modal');
                document.body.style.overflow = '';
            }
        }
    };

    // Attach to global window scope
    window.SPA = SPA;

    // Load after DOM content is ready
    document.addEventListener('DOMContentLoaded', () => {
        SPA.init();
    });
})();
