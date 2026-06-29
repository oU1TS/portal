// Stars Module for oU1TS Portal

const Stars = {
    resourceType: null,  // Set based on current page
    starCounts: {},      // Cache of star counts
    userStars: new Set(), // Resources starred by current user

    // Initialize stars for current page
    async init(resourceType) {
        this.resourceType = resourceType;
        await this.loadStars();
    },

    // Load all star data for current page
    async loadStars() {
        if (!this.resourceType) return;
        
        await Promise.all([
            this.loadStarCounts(),
            this.loadUserStars()
        ]);

        this.updateAllStarButtons();
        this.sortResourcesByStars();
    },

    // Get star counts for all resources on page
    async loadStarCounts() {
        const supabase = window.supabaseClient;
        if (!supabase) return;

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

    // Get resources starred by current user
    async loadUserStars() {
        const supabase = window.supabaseClient;
        const user = window.Auth?.currentUser;
        
        if (!supabase || !user) {
            this.userStars = new Set();
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
            openAuthModal('login');
            return;
        }

        const isStarred = this.userStars.has(resourceId);
        const button = document.querySelector(`[data-resource-id="${resourceId}"] .star-btn`);
        
        // Optimistic UI update
        if (button) {
            button.classList.toggle('starred');
            const countSpan = button.querySelector('.star-count');
            const currentCount = this.starCounts[resourceId] || 0;
            const newCount = isStarred ? currentCount - 1 : currentCount + 1;
            if (countSpan) countSpan.textContent = newCount;
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

    // Update all star buttons on page
    updateAllStarButtons() {
        const starButtons = document.querySelectorAll('[data-resource-id]');
        
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

    // Sort resources by star count (highest first)
    sortResourcesByStars() {
        const container = document.querySelector('.project-list, .course-list');
        if (!container) return;

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
