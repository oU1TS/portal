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

    // Load featured project marquee immediately on page load
    document.addEventListener('DOMContentLoaded', () => {
        loadFeatured();
    });

    async function loadFeatured() {
        try {
            const response = await fetch('json/featured.json');
            if (response.ok) {
                const data = await response.json();
                renderFeatured(data);
            }
        } catch (error) {
            console.error('Error rendering featured marquee:', error);
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

    // Renderer for featured projects marquee on homepage
    function renderFeatured(items) {
        const track = document.querySelector('#featured .marquee-track');
        if (!track) return;

        track.innerHTML = '';

        const createMarqueeItem = (item) => {
            const a = document.createElement('a');
            a.href = item.url;
            a.className = 'marquee-item';
            a.target = '_blank';

            let mediaHtml = '';
            if (item.img) {
                const altAttr = item.alt ? ` alt="${item.alt}"` : '';
                mediaHtml = `<img src="${item.img}"${altAttr}>`;
            } else if (item.icon) {
                mediaHtml = `<div class="marquee-placeholder"><i class="${item.icon}"></i></div>`;
            }

            a.innerHTML = `
                ${mediaHtml}
                <span>${item.title}</span>
            `;
            return a;
        };

        // Render original items
        items.forEach(item => {
            track.appendChild(createMarqueeItem(item));
        });

        // Duplicate for seamless loop
        items.forEach(item => {
            track.appendChild(createMarqueeItem(item));
        });
    }
})();
