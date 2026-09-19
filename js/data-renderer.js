// js/data-renderer.js
// Handles dynamic rendering of JSON data for portal SPA pages and integration with Stars.js

(function () {
    // Expose DataRenderer to window
    window.DataRenderer = {
        render(pageType, data) {
            if (pageType === 'featured') {
                renderFeatured(data);
            } else if (pageType === 'courses') {
                renderCourses(data);
            } else if (pageType === 'inspirations') {
                renderInspirations(data);
            } else {
                renderStandardList(pageType, data);
            }
        }
    };

    // Load featured project gallery on page load
    document.addEventListener('DOMContentLoaded', () => {
        loadFeatured();
    });

    // Helper to normalize any project item across all json schemas into a gallery item
    function normalizeProjectItem(item, defaultCategory) {
        if (!item) return null;

        let title = item.title;
        let url = item.url || item.visitUrl || item.copyUrl || '#';
        let description = item.description || '';

        // Handle course items or items with rawHtml
        if (!title && item.rawHtml) {
            const div = document.createElement('div');
            div.innerHTML = item.rawHtml;
            const a = div.querySelector('a');
            if (a) {
                title = a.textContent.trim();
                url = a.getAttribute('href') || url;
            }
            const p = div.querySelector('p');
            if (p) description = p.textContent.trim();
        }

        // Clean HTML markup from description for the slider
        const cleanDesc = description
            ? description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
            : 'Verified student-led project and resource on the oU1TS portal.';

        // Extract media
        let img = item.img || item.image || null;
        let icon = item.icon || null;
        if (!img && !icon && item.iconClass) {
            icon = { type: 'icon', class: item.iconClass };
        }

        // Category label
        const categoryLabel = item.category || defaultCategory || 'Initiative';

        // Dynamic badges
        const rankLabels = ['#1 Top Trend', '#2 Highly Rated', '#3 Student Pick', 'Community Choice', 'Staff Highlight', 'Trending Hub'];
        const randomRank = rankLabels[Math.floor(Math.random() * rankLabels.length)];

        return {
            id: item.id || `feat-${Math.random().toString(36).substr(2, 7)}`,
            title: title || 'Featured Initiative',
            url: url,
            description: cleanDesc,
            img: img,
            icon: icon,
            category: categoryLabel,
            rank: item.rank || randomRank
        };
    }

    // Fetches top ranked featured projects: picks randomly from the top 3 of each JSON list in json/
    async function loadFeatured() {
        let featuredProjects = null;

        // 1. PLACEHOLDER: Attempt to fetch from ou1ts-backend Vercel API or Supabase
        try {
            const backendApiUrl = 'https://ou1tsbackend.vercel.app/api/featured';
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1200);

            const res = await fetch(backendApiUrl, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (res.ok) {
                const apiData = await res.json();
                if (Array.isArray(apiData) && apiData.length > 0) {
                    featuredProjects = apiData;
                }
            }
        } catch (err) {
            // Backend offline or not yet configured - silently proceed to multi-list JSON loader
        }

        // 2. Load at random from the top 3 of each of the json/ project lists
        if (!featuredProjects || featuredProjects.length === 0) {
            try {
                const PROJECT_LISTS = [
                    { file: 'materials.json', category: 'Materials' },
                    { file: 'tools.json', category: 'Tools' },
                    { file: 'capstones.json', category: 'Capstone' },
                    { file: 'community.json', category: 'Community' },
                    { file: 'guidance.json', category: 'Guidance' },
                    { file: 'official.json', category: 'Official' },
                    { file: 'portfolios.json', category: 'Portfolio' },
                    { file: 'inspirations.json', category: 'Inspirations', isNested: true },
                    { file: 'courses.json', category: 'Courses', isNested: true }
                ];

                const fetchPromises = PROJECT_LISTS.map(async (cfg) => {
                    try {
                        const res = await fetch(`json/${cfg.file}`);
                        if (!res.ok) return null;
                        const data = await res.json();
                        let items = [];
                        if (cfg.isNested) {
                            items = (data || []).flatMap(section => section.items || []);
                        } else if (Array.isArray(data)) {
                            items = data;
                        }

                        if (!items || items.length === 0) return null;

                        // Extract top 3 of this project list
                        const top3 = items.slice(0, 3);
                        // Pick 1 at random from top 3
                        const picked = top3[Math.floor(Math.random() * top3.length)];
                        return normalizeProjectItem(picked, cfg.category);
                    } catch (e) {
                        return null;
                    }
                });

                const settled = await Promise.allSettled(fetchPromises);
                const candidates = settled
                    .filter(p => p.status === 'fulfilled' && p.value !== null)
                    .map(p => p.value);

                if (candidates.length > 0) {
                    // Shuffle the diverse project pool so order changes on every refresh
                    featuredProjects = candidates.sort(() => 0.5 - Math.random());
                }
            } catch (error) {
                console.error('Error loading random featured projects from json lists:', error);
            }
        }

        if (featuredProjects && featuredProjects.length > 0) {
            renderFeaturedGallery(featuredProjects);
        }
    }

    // Standard renderer for: materials, community, guidance, official, tools, portfolios
    function renderStandardList(pageType, items) {
        const container = document.querySelector(`#${pageType}View .project-list`);
        if (!container) return;

        // Clear existing items
        container.innerHTML = '';

        items.forEach((item, index) => {
            const projectItem = document.createElement('div');
            projectItem.className = 'project-item';
            projectItem.setAttribute('data-resource-id', item.id);

            // Project number format (01, 02...)
            const indexStr = String(index + 1).padStart(2, '0');

            // Icon markup
            let iconHtml = '';
            if (item.icon) {
                if (item.icon.type === 'image') {
                    const altAttr = item.icon.alt ? ` alt="${item.icon.alt}"` : '';
                    iconHtml = `<img src="${item.icon.src}"${altAttr}>`;
                } else if (item.icon.type === 'icon') {
                    const colorStyle = item.icon.color ? ` style="color: ${item.icon.color};"` : '';
                    iconHtml = `<i class="${item.icon.class}"${colorStyle}></i>`;
                }
            }

            const iconBg = item.icon && item.icon.background ? ` style="background: ${item.icon.background};"` : '';

            // Links / Dev profiles markup
            let linksHtml = '';
            if (item.links && item.links.length > 0) {
                linksHtml = '<br>' + item.links.map(link => {
                    let label = link.label;
                    if (link.parentheses) {
                        return `( <a href="${link.url}" target="_blank">${label}</a> )`;
                    }
                    let suffix = link.suffix ? ` ${link.suffix}` : '';
                    return `<a href="${link.url}" target="_blank">${label}</a>${suffix}`;
                }).join(' | ');
            }

            // Description and repo info container
            const descClass = (item.links && item.links.length > 0) || pageType === 'materials' || pageType === 'portfolios' || pageType === 'guidance' || pageType === 'official' || pageType === 'tools' ? 'repo-info' : '';
            const descriptionHtml = `<p class="${descClass}">${item.description}${linksHtml}</p>`;

            // Extra details (e.g. portfolios tags)
            let extraHtml = '';
            if (item.tags && item.tags.length > 0) {
                extraHtml = `
                    <div class="expertise-tags">
                        ${item.tags.map(tag => `<span class="expertise-tag">${tag}</span>`).join('')}
                    </div>
                `;
            }

            // Disable class for star button if not logged in
            const starClass = window.Auth && window.Auth.isLoggedIn() ? 'star-btn' : 'star-btn disabled';

            projectItem.innerHTML = `
                <span class="project-number">${indexStr}</span>
                <div class="project-icon"${iconBg}>
                    ${iconHtml}
                </div>
                <div class="project-info">
                    <h3>${item.title}</h3>
                    ${descriptionHtml}
                    ${extraHtml}
                </div>
                <div class="project-actions">
                    <button class="${starClass}" onclick="window.Stars.toggleStar('${item.id}')" title="Login to star resources">
                        <i class="fa-solid fa-star"></i>
                        <span class="star-count">0</span>
                    </button>
                    <a href="${item.visitUrl}" class="visit-btn" target="_blank">
                        Visit <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    </a>
                    <button class="copy-btn" onclick="copyLink('${item.copyUrl || item.visitUrl}')">
                        <i class="fa-regular fa-copy"></i>
                    </button>
                </div>
            `;

            container.appendChild(projectItem);
        });
    }

    // Renderer for courses dropdown list
    function renderCourses(sections) {
        const container = document.querySelector('#coursesView .course-list');
        if (!container) return;

        container.innerHTML = ''; // Clear dropdowns

        sections.forEach((section, sIndex) => {
            const dropdown = document.createElement('div');
            dropdown.className = 'course-dropdown';

            const itemsHtml = section.items.map(item => {
                const starClass = window.Auth && window.Auth.isLoggedIn() ? 'star-btn' : 'star-btn disabled';
                return `
                    <div class="repo-item" data-resource-id="${item.id}">
                        <i class="${item.iconClass}"></i>
                        <div class="repo-info">
                            ${item.rawHtml}
                        </div>
                        <button class="${starClass}" onclick="window.Stars.toggleStar('${item.id}')" title="Login to star resources">
                            <i class="fa-solid fa-star"></i>
                            <span class="star-count">0</span>
                        </button>
                    </div>
                `;
            }).join('');

            dropdown.innerHTML = `
                <button class="course-header" onclick="toggleDropdown(this)">
                    <span><i class="${section.icon}"></i> ${section.category}</span>
                    <i class="fa-solid fa-chevron-down"></i>
                </button>
                <div class="course-content">
                    ${itemsHtml || '<!-- Empty for now -->'}
                </div>
            `;

            container.appendChild(dropdown);

            // Add separator hr only below "All Courses" (which is the first dropdown, sIndex === 0)
            if (sIndex === 0) {
                const hr = document.createElement('hr');
                hr.style.margin = '25px 0';
                container.appendChild(hr);
            }
        });
    }

    // Renderer for inspirations dropdown list
    function renderInspirations(sections) {
        const container = document.querySelector('#inspirationsView .inspirations-list');
        if (!container) return;

        container.innerHTML = ''; // Clear dropdowns

        sections.forEach(section => {
            const dropdown = document.createElement('div');
            dropdown.className = 'course-dropdown';

            const itemsHtml = section.items.map(item => {
                const starClass = window.Auth && window.Auth.isLoggedIn() ? 'star-btn' : 'star-btn disabled';
                return `
                    <div class="repo-item" data-resource-id="${item.id}">
                        <i class="fa-solid fa-link"></i>
                        <div class="repo-info">
                            <a href="${item.url}" target="_blank">${item.title}</a>
                            <p>${item.description}</p>
                        </div>
                        <button class="${starClass}" onclick="window.Stars.toggleStar('${item.id}')" title="Login to star resources">
                            <i class="fa-solid fa-star"></i>
                            <span class="star-count">0</span>
                        </button>
                    </div>
                `;
            }).join('');

            dropdown.innerHTML = `
                <button class="course-header" onclick="toggleDropdown(this)" style="display: flex; flex-direction: column; align-items: center; text-align: center; position: relative;">
                    <div style="width: 100%;">
                        <p style="font-size: 1.8rem; font-weight: bold; color: ${section.color || '#64b5f6'}; margin: 0;">${section.category}</p><br>
                        <p style="font-size: 0.9rem; font-weight: normal; color: #a0a0a0; margin: 0;">${section.fullName}</p>
                    </div>
                    <i class="fa-solid fa-chevron-down" style="position: absolute; right: 1.5rem; top: 50%; transform: translateY(-50%);"></i>
                </button>
                <div class="course-content">
                    ${itemsHtml || '<!-- Empty for now -->'}
                </div>
            `;

            container.appendChild(dropdown);
        });
    }

    // ==========================================================================
    // CHANGING GALLERY VIEW FOR FEATURED PROJECTS
    // ==========================================================================
    function renderFeaturedGallery(items) {
        const container = document.getElementById('featuredGallery');
        const track = document.getElementById('galleryTrack');
        const indicators = document.getElementById('galleryIndicators');
        const prevBtn = document.getElementById('galleryPrev');
        const nextBtn = document.getElementById('galleryNext');
        if (!track || !items || items.length === 0) return;

        track.innerHTML = '';
        if (indicators) indicators.innerHTML = '';

        let currentIndex = 0;
        let autoChangeTimer = null;
        const intervalMs = 4800; // Changes project every 4.8 seconds

        // Build Slides & Indicator Dots
        items.forEach((item, index) => {
            // Slide container
            const slide = document.createElement('div');
            slide.className = `gallery-slide ${index === 0 ? 'active' : ''}`;
            slide.dataset.index = index;

            // Media
            let mediaHtml = '';
            if (item.img) {
                const alt = item.alt || item.title || 'Project';
                mediaHtml = `<img src="${item.img}" alt="${alt}" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'gallery-placeholder\\'><i class=\\'fa-solid fa-layer-group\\'></i></div>';">`;
            } else if (item.image) {
                const alt = item.alt || item.title || 'Project';
                mediaHtml = `<img src="${item.image}" alt="${alt}" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'gallery-placeholder\\'><i class=\\'fa-solid fa-layer-group\\'></i></div>';">`;
            } else if (item.icon) {
                if (typeof item.icon === 'string') {
                    mediaHtml = `<div class="gallery-placeholder"><i class="${item.icon}"></i></div>`;
                } else if (item.icon.type === 'image' && item.icon.src) {
                    mediaHtml = `<img src="${item.icon.src}" alt="${item.title || 'Project'}" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'gallery-placeholder\\'><i class=\\'fa-solid fa-layer-group\\'></i></div>';">`;
                } else if (item.icon.class) {
                    const iconColor = item.icon.color || '#38bdf8';
                    mediaHtml = `<div class="gallery-placeholder" style="color: ${iconColor};"><i class="${item.icon.class}"></i></div>`;
                } else {
                    mediaHtml = `<div class="gallery-placeholder"><i class="fa-solid fa-star"></i></div>`;
                }
            } else {
                mediaHtml = `<div class="gallery-placeholder"><i class="fa-solid fa-layer-group"></i></div>`;
            }

            slide.innerHTML = `
                <a href="${item.url || item.visitUrl || '#'}" class="gallery-card" target="_blank" rel="noopener noreferrer">
                    <div class="gallery-media-col">
                        <div class="gallery-media">
                            ${mediaHtml}
                        </div>
                        <span class="gallery-category-pill">${item.category || 'Initiative'}</span>
                    </div>
                    <div class="gallery-info">
                        <span class="gallery-rank-pill"><i class="fa-solid fa-trophy"></i> ${item.rank || `#${index + 1} Featured`}</span>
                        <h3 class="gallery-title">${item.title}</h3>
                        <p class="gallery-desc">${item.description || 'Verified open resource for UITS students and developers.'}</p>
                        <div class="gallery-action">
                            <span class="gallery-visit-btn">Visit Project <i class="fa-solid fa-arrow-up-right-from-square"></i></span>
                        </div>
                    </div>
                </a>
            `;
            track.appendChild(slide);

            // Indicator dot
            if (indicators) {
                const dot = document.createElement('button');
                dot.className = `gallery-dot ${index === 0 ? 'active' : ''}`;
                dot.setAttribute('aria-label', `Go to project ${index + 1}`);
                dot.addEventListener('click', () => {
                    goToSlide(index);
                    restartAutoTimer();
                });
                indicators.appendChild(dot);
            }
        });

        const slides = track.querySelectorAll('.gallery-slide');
        const dots = indicators ? indicators.querySelectorAll('.gallery-dot') : [];

        function goToSlide(newIndex) {
            if (newIndex < 0) {
                currentIndex = slides.length - 1;
            } else if (newIndex >= slides.length) {
                currentIndex = 0;
            } else {
                currentIndex = newIndex;
            }

            slides.forEach((s, i) => {
                s.classList.toggle('active', i === currentIndex);
            });

            dots.forEach((d, i) => {
                d.classList.toggle('active', i === currentIndex);
            });
        }

        function nextSlide() {
            goToSlide(currentIndex + 1);
        }

        function prevSlide() {
            goToSlide(currentIndex - 1);
        }

        // Attach Arrow Listeners
        if (prevBtn) {
            prevBtn.onclick = () => {
                prevSlide();
                restartAutoTimer();
            };
        }
        if (nextBtn) {
            nextBtn.onclick = () => {
                nextSlide();
                restartAutoTimer();
            };
        }

        // Auto Advance Interval
        function startAutoTimer() {
            stopAutoTimer();
            autoChangeTimer = setInterval(nextSlide, intervalMs);
        }

        function stopAutoTimer() {
            if (autoChangeTimer) {
                clearInterval(autoChangeTimer);
                autoChangeTimer = null;
            }
        }

        function restartAutoTimer() {
            stopAutoTimer();
            startAutoTimer();
        }

        // Pause on hover
        if (container) {
            container.addEventListener('mouseenter', stopAutoTimer);
            container.addEventListener('mouseleave', startAutoTimer);
        }

        startAutoTimer();
    }
})();
