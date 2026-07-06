// Stars Module for oU1TS Portal
// Manages stars counts, updates star icons, performs sorting, and integrates with Supabase / LocalStorage database fallback.

const Stars = {
    resourceType: null,  // Set based on current page/view
    starCounts: {},      // Cache of star counts
    userStars: new Set(), // Resources starred by current user

    // Initialize stars for current page/view
    async init(resourceType) {
        this.resourceType = resourceType;
        this.initializeLocalDatabaseIfEmpty();
        await this.loadStars();
    },

    // Load mock database from backup json into localStorage if it's not set
    initializeLocalDatabaseIfEmpty() {
        if (!localStorage.getItem('local_stars_database')) {
            const mockStars = [
                {"id":5,"user_id":"2d4f5701-c2a4-4b56-8ab1-ae57296c4e14","resource_type":"guidance","resource_id":"guidance-faq-capstone","created_at":"2026-02-05 17:28:26+00"},
                {"id":7,"user_id":"15c505cd-24c3-4499-9d70-fa26ee74f37f","resource_type":"guidance","resource_id":"guidance-faq-capstone","created_at":"2026-02-05 20:23:44+00"},
                {"id":17,"user_id":"2d4f5701-c2a4-4b56-8ab1-ae57296c4e14","resource_type":"community","resource_id":"community-telegram","created_at":"2026-02-06 07:03:48+00"},
                {"id":22,"user_id":"2d4f5701-c2a4-4b56-8ab1-ae57296c4e14","resource_type":"community","resource_id":"discord-protein-shake","created_at":"2026-02-06 07:06:29+00"},
                {"id":24,"user_id":"55552670-e896-459f-9948-151c8744c64c","resource_type":"portfolios","resource_id":"portfolio-chatokjnr","created_at":"2026-02-06 15:02:15+00"},
                {"id":25,"user_id":"55552670-e896-459f-9948-151c8744c64c","resource_type":"portfolios","resource_id":"portfolio-atikshahria","created_at":"2026-02-06 15:02:19+00"},
                {"id":26,"user_id":"55552670-e896-459f-9948-151c8744c64c","resource_type":"portfolios","resource_id":"portfolio-b1tranger","created_at":"2026-02-06 15:02:20+00"},
                {"id":27,"user_id":"15c505cd-24c3-4499-9d70-fa26ee74f37f","resource_type":"community","resource_id":"discord-protein-shake","created_at":"2026-02-06 21:00:08+00"},
                {"id":28,"user_id":"15c505cd-24c3-4499-9d70-fa26ee74f37f","resource_type":"portfolios","resource_id":"portfolio-KaziMdAzharUddinAbeer","created_at":"2026-02-06 21:44:12+00"},
                {"id":29,"user_id":"15c505cd-24c3-4499-9d70-fa26ee74f37f","resource_type":"portfolios","resource_id":"portfolio-chatokjnr","created_at":"2026-02-06 21:44:23+00"},
                {"id":30,"user_id":"15c505cd-24c3-4499-9d70-fa26ee74f37f","resource_type":"portfolios","resource_id":"portfolio-AkibReza","created_at":"2026-02-06 21:44:57+00"},
                {"id":31,"user_id":"d949b1ef-180e-4f0a-bce5-674258d9fd7b","resource_type":"portfolios","resource_id":"portfolio-MahfuzRahman","created_at":"2026-02-07 05:58:58+00"},
                {"id":33,"user_id":"15c505cd-24c3-4499-9d70-fa26ee74f37f","resource_type":"materials","resource_id":"materials-b1tacad","created_at":"2026-02-09 02:57:28+00"},
                {"id":34,"user_id":"2d4f5701-c2a4-4b56-8ab1-ae57296c4e14","resource_type":"portfolios","resource_id":"portfolio-chatokjnr","created_at":"2026-02-10 06:40:01+00"},
                {"id":40,"user_id":"15c505cd-24c3-4499-9d70-fa26ee74f37f","resource_type":"materials","resource_id":"materials-b1tsched","created_at":"2026-02-11 06:17:36+00"},
                {"id":50,"user_id":"15c505cd-24c3-4499-9d70-fa26ee74f37f","resource_type":"courses","resource_id":"courses-sesa-sadiasemim139-ops","created_at":"2026-02-11 06:34:26+00"},
                {"id":51,"user_id":"15c505cd-24c3-4499-9d70-fa26ee74f37f","resource_type":"courses","resource_id":"courses-dsa1-robiul","created_at":"2026-02-11 06:34:35+00"},
                {"id":52,"user_id":"15c505cd-24c3-4499-9d70-fa26ee74f37f","resource_type":"courses","resource_id":"courses-sesa-Binary-Eclipse","created_at":"2026-02-11 06:34:44+00"},
                {"id":58,"user_id":"15c505cd-24c3-4499-9d70-fa26ee74f37f","resource_type":"community","resource_id":"ou1ts-community-fb","created_at":"2026-02-11 06:47:12+00"},
                {"id":59,"user_id":"15c505cd-24c3-4499-9d70-fa26ee74f37f","resource_type":"portfolios","resource_id":"portfolio-safrid","created_at":"2026-02-14 18:34:48+00"},
                {"id":63,"user_id":"15c505cd-24c3-4499-9d70-fa26ee74f37f","resource_type":"tools","resource_id":"tools-b1tsched","created_at":"2026-02-24 01:51:39+00"},
                {"id":64,"user_id":"15c505cd-24c3-4499-9d70-fa26ee74f37f","resource_type":"community","resource_id":"community-discord-golang","created_at":"2026-02-25 15:48:43+00"},
                {"id":65,"user_id":"15c505cd-24c3-4499-9d70-fa26ee74f37f","resource_type":"materials","resource_id":"materials-researchArchive","created_at":"2026-03-11 12:50:52+00"},
                {"id":66,"user_id":"2d4f5701-c2a4-4b56-8ab1-ae57296c4e14","resource_type":"materials","resource_id":"materials-researchArchive","created_at":"2026-03-11 13:14:33+00"},
                {"id":67,"user_id":"f90aa32f-c815-4a4d-b5e2-6d729154b41e","resource_type":"tools","resource_id":"tools-b1tsched","created_at":"2026-03-12 05:25:21+00"},
                {"id":68,"user_id":"15c505cd-24c3-4499-9d70-fa26ee74f37f","resource_type":"materials","resource_id":"materials-uniCompanion","created_at":"2026-04-02 17:25:06+00"}
            ];
            localStorage.setItem('local_stars_database', JSON.stringify(mockStars));
        }
    },

    // Load all star data for current page/view
    async loadStars() {
        if (!this.resourceType) return;
        
        await Promise.all([
            this.loadStarCounts(),
            this.loadUserStars()
        ]);

        this.updateAllStarButtons();
        this.sortResourcesByStars();
    },

    // Get star counts for all resources in active view
    async loadStarCounts() {
        const supabase = window.supabaseClient;
        if (!supabase) {
            // Local storage fallback star counts
            try {
                const allStars = JSON.parse(localStorage.getItem('local_stars_database') || '[]');
                const filtered = allStars.filter(s => s.resource_type === this.resourceType);
                
                this.starCounts = {};
                filtered.forEach(star => {
                    this.starCounts[star.resource_id] = (this.starCounts[star.resource_id] || 0) + 1;
                });
            } catch (err) {
                console.error('Error reading local star counts:', err);
                this.starCounts = {};
            }
            return;
        }

        try {
            const { data, error } = await supabase
                .from('stars')
                .select('resource_id')
                .eq('resource_type', this.resourceType);

            if (error) throw error;

            // Count stars per resource
            this.starCounts = {};
            data?.forEach(star => {
                this.starCounts[star.resource_id] = (this.starCounts[star.resource_id] || 0) + 1;
            });
        } catch (error) {
            console.error('Error loading star counts:', error);
        }
    },

    // Get resources starred by current user in active view
    async loadUserStars() {
        const supabase = window.supabaseClient;
        const user = window.Auth?.currentUser;
        
        if (!user) {
            this.userStars = new Set();
            return;
        }

        if (!supabase) {
            // Local storage fallback user stars
            try {
                const allStars = JSON.parse(localStorage.getItem('local_stars_database') || '[]');
                const filtered = allStars.filter(s => s.resource_type === this.resourceType && s.user_id === user.id);
                this.userStars = new Set(filtered.map(s => s.resource_id));
            } catch (err) {
                console.error('Error loading local user stars:', err);
                this.userStars = new Set();
            }
            return;
        }

        try {
            const { data, error } = await supabase
                .from('stars')
                .select('resource_id')
                .eq('resource_type', this.resourceType)
                .eq('user_id', user.id);

            if (error) throw error;

            this.userStars = new Set(data?.map(s => s.resource_id) || []);
        } catch (error) {
            console.error('Error loading user stars:', error);
            this.userStars = new Set();
        }
    },

    // Toggle star for a resource
    async toggleStar(resourceId) {
        const supabase = window.supabaseClient;
        const user = window.Auth?.currentUser;

        if (!user) {
            // Open auth hash
            window.location.hash = '#profile';
            return;
        }

        const isStarred = this.userStars.has(resourceId);
        const button = document.querySelector(`#${this.resourceType}View [data-resource-id="${resourceId}"] .star-btn`);
        
        // Optimistic UI update
        if (button) {
            button.classList.toggle('starred');
            const countSpan = button.querySelector('.star-count');
            const currentCount = this.starCounts[resourceId] || 0;
            const newCount = isStarred ? currentCount - 1 : currentCount + 1;
            if (countSpan) countSpan.textContent = newCount;
        }

        if (!supabase) {
            // Local storage toggle
            try {
                let allStars = JSON.parse(localStorage.getItem('local_stars_database') || '[]');
                if (isStarred) {
                    allStars = allStars.filter(s => !(s.user_id === user.id && s.resource_type === this.resourceType && s.resource_id === resourceId));
                    this.userStars.delete(resourceId);
                    this.starCounts[resourceId] = Math.max(0, (this.starCounts[resourceId] || 1) - 1);
                } else {
                    const newStar = {
                        id: Date.now(),
                        user_id: user.id,
                        resource_type: this.resourceType,
                        resource_id: resourceId,
                        created_at: new Date().toISOString()
                    };
                    allStars.push(newStar);
                    this.userStars.add(resourceId);
                    this.starCounts[resourceId] = (this.starCounts[resourceId] || 0) + 1;
                }
                localStorage.setItem('local_stars_database', JSON.stringify(allStars));
                
                // Keep star button class updated
                if (button) {
                    if (this.userStars.has(resourceId)) {
                        button.classList.add('starred');
                    } else {
                        button.classList.remove('starred');
                    }
                }
                
                // Re-sort elements
                this.sortResourcesByStars();
                
                // Update profile view metrics if it's currently loaded
                if (window.SPA && window.SPA.currentRoute === 'profile') {
                    window.SPA.loadUserStarredList();
                }
            } catch (err) {
                console.error('Error toggling local star:', err);
                alert('Failed to update star locally.');
            }
            return;
        }

        try {
            if (isStarred) {
                // Remove star
                const { error } = await supabase
                    .from('stars')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('resource_type', this.resourceType)
                    .eq('resource_id', resourceId);

                if (error) throw error;

                this.userStars.delete(resourceId);
                this.starCounts[resourceId] = Math.max(0, (this.starCounts[resourceId] || 1) - 1);
            } else {
                // Add star
                const { error } = await supabase
                    .from('stars')
                    .insert({
                        user_id: user.id,
                        resource_type: this.resourceType,
                        resource_id: resourceId
                    });

                if (error) throw error;

                this.userStars.add(resourceId);
                this.starCounts[resourceId] = (this.starCounts[resourceId] || 0) + 1;
            }

            // Sync classes
            if (button) {
                if (this.userStars.has(resourceId)) {
                    button.classList.add('starred');
                } else {
                    button.classList.remove('starred');
                }
            }

            this.sortResourcesByStars();
        } catch (error) {
            console.error('Error toggling star:', error);
            
            // Revert optimistic update on error
            if (button) {
                button.classList.toggle('starred');
                const countSpan = button.querySelector('.star-count');
                if (countSpan) countSpan.textContent = this.starCounts[resourceId] || 0;
            }
            
            alert('Failed to update star. Please try again.');
        }
    },

    // Update all star buttons on active view page
    updateAllStarButtons() {
        const starButtons = document.querySelectorAll(`#${this.resourceType}View [data-resource-id]`);
        
        starButtons.forEach(item => {
            const resourceId = item.dataset.resourceId;
            const button = item.querySelector('.star-btn');
            
            if (button) {
                // Update star count
                const countSpan = button.querySelector('.star-count');
                if (countSpan) {
                    countSpan.textContent = this.starCounts[resourceId] || 0;
                }

                // Update starred state
                if (this.userStars.has(resourceId)) {
                    button.classList.add('starred');
                } else {
                    button.classList.remove('starred');
                }

                // Update disabled state based on auth
                if (window.Auth?.currentUser) {
                    button.classList.remove('disabled');
                } else {
                    button.classList.add('disabled');
                }
            }
        });
    },

    // Sort resources in active view by star count (highest first)
    sortResourcesByStars() {
        const container = document.querySelector(`#${this.resourceType}View .project-list, #${this.resourceType}View .course-list`);
        if (!container) return;

        // If it's the courses page, use custom per-dropdown sorting
        if (this.resourceType === 'courses') {
            this.sortAllCoursesDropdowns(container);
            return;
        }

        const items = Array.from(container.querySelectorAll('[data-resource-id]'));
        if (items.length === 0) return;

        // Sort by star count descending
        items.sort((a, b) => {
            const countA = this.starCounts[a.dataset.resourceId] || 0;
            const countB = this.starCounts[b.dataset.resourceId] || 0;
            return countB - countA;
        });

        // Re-append in sorted order and update numbers
        items.forEach((item, index) => {
            container.appendChild(item);
            
            // Update project number
            const numberSpan = item.querySelector('.project-number');
            if (numberSpan) {
                numberSpan.textContent = String(index + 1).padStart(2, '0');
            }
        });
    },

    sortAllCoursesDropdowns(container) {
        container.querySelectorAll('.course-content').forEach(content => {
            const items = Array.from(content.querySelectorAll('.repo-item'));
            if (items.length <= 1) return;

            items.sort((a, b) => {
                const countA = this.starCounts[a.dataset.resourceId] || 0;
                const countB = this.starCounts[b.dataset.resourceId] || 0;
                return countB - countA;
            });

            items.forEach(item => content.appendChild(item));
        });
    },

    // Get star count for a specific resource
    getStarCount(resourceId) {
        return this.starCounts[resourceId] || 0;
    },

    // Check if current user has starred a resource
    isStarred(resourceId) {
        return this.userStars.has(resourceId);
    }
};

// Export for use in other modules
window.Stars = Stars;
