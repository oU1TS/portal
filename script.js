// script.js (Updated)

// --- Element Selection ---
const menuToggle = document.getElementById('menuToggle');
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const mainContent = document.querySelector('.main-content');
const searchBox = document.getElementById('searchBox');
const resourceCards = document.querySelectorAll('.resource-card');

// --- Functions to Open/Close Menu ---

function openMobileMenu() {
    if (sidebar) sidebar.classList.add('active');
    if (overlay) overlay.classList.add('active');
    // Send button to the back so it can't be clicked when menu is open
    if (mobileMenuToggle) mobileMenuToggle.style.zIndex = '998';
}

function closeMobileMenu() {
    if (sidebar) sidebar.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    // Bring button back to the front
    if (mobileMenuToggle) mobileMenuToggle.style.zIndex = '1001';
}


// --- Event Listeners ---

// Desktop menu toggle (if exists)
if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        if (sidebar) sidebar.classList.toggle('active');
        if (overlay) overlay.classList.toggle('active');
    });
}

// Mobile menu toggle
if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        // Check if menu is already open before toggling
        const isMenuOpen = sidebar && sidebar.classList.contains('active');
        if (isMenuOpen) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    });
}

// Close menu when clicking the overlay
if (overlay) {
    overlay.addEventListener('click', closeMobileMenu);
}

// Smooth scrolling for navigation links / hash routing compatibility
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        // Check if it's an anchor link for scrolling
        if (href.startsWith('#')) {
            const targetId = href.substring(1);
            const scrollTargets = ['featured', 'about', 'platforms', 'download-qr'];
            
            if (scrollTargets.includes(targetId)) {
                e.preventDefault();
                // Go to home view first if in a sub-view
                if (window.location.hash !== '') {
                    window.location.hash = '';
                    // Delay scroll slightly to allow home view to render
                    setTimeout(() => {
                        const targetElement = document.getElementById(targetId);
                        if (targetElement) {
                            targetElement.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start'
                            });
                        }
                    }, 400);
                } else {
                    const targetElement = document.getElementById(targetId);
                    if (targetElement) {
                        targetElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }
            }
        }

        // Always close the mobile menu after a link is clicked
        if (window.innerWidth <= 768) {
            closeMobileMenu();
        }
    });
});

// Search functionality (if search box exists)
if (searchBox) {
    searchBox.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();

        resourceCards.forEach(card => {
            const title = card.querySelector('h3')?.textContent?.toLowerCase() || '';
            const description = card.querySelector('p')?.textContent?.toLowerCase() || '';

            if (title.includes(searchTerm) || description.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });
}

// Handle window resize
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        // Ensure mobile-specific states are cleared on resize to desktop
        closeMobileMenu();
    }
});

// --- PWA Service Worker Registration ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then((reg) => console.log('Service Worker Registered', reg))
            .catch((err) => console.log('Service Worker Registration Failed', err));
    });
}

// ==========================================================================
// TYPEWRITER ANIMATION FOR TOP-LEFT BRAND SUBTITLE
// ==========================================================================
function startBrandTypewriter() {
    const typewriterEl = document.getElementById('brandTypewriter');
    const subTagsEl = document.getElementById('brandSubTags');
    if (!typewriterEl) return;

    if (typewriterEl.dataset.typingStarted === 'true') return;
    typewriterEl.dataset.typingStarted = 'true';

    const fullText = 'Projects for and by the students of UITS.';
    typewriterEl.textContent = '';
    let charIndex = 0;
    const typingSpeed = 38; // ms per char

    function typeChar() {
        if (charIndex < fullText.length) {
            typewriterEl.textContent += fullText.charAt(charIndex);
            charIndex++;
            setTimeout(typeChar, typingSpeed);
        } else {
            typewriterEl.classList.add('done-typing');
            if (subTagsEl) {
                subTagsEl.classList.add('visible');
            }
        }
    }

    setTimeout(typeChar, 200);
}

// ==========================================================================
// PRELOADER CONTROLLER (Centered -> Minimize Directly to Top-Left Site Brand)
// ==========================================================================
function initPreloader() {
    const preloader = document.getElementById('portalPreloader');
    const preloaderTitle = document.getElementById('preloaderTitle');
    const preloaderTagline = document.getElementById('preloaderTagline');
    const preloaderLine = document.getElementById('preloaderLine');
    const siteBrand = document.getElementById('siteBrand');
    
    if (!preloader || !preloaderTitle) {
        startBrandTypewriter();
        return;
    }

    // Initially hide destination brand text so it doesn't duplicate while preloader is centered
    if (siteBrand) {
        siteBrand.style.opacity = '0';
    }

    // Step 1: Hold centered for 850ms
    setTimeout(() => {
        // Fade out tagline and progress line smoothly
        if (preloaderTagline) preloaderTagline.style.opacity = '0';
        if (preloaderLine) preloaderLine.style.opacity = '0';

        // Step 2: Calculate exact pixel trajectory to top-left siteBrand position
        if (siteBrand) {
            const brandRect = siteBrand.getBoundingClientRect();
            const titleRect = preloaderTitle.getBoundingClientRect();

            // Center-to-center delta
            const currentCenterX = titleRect.left + titleRect.width / 2;
            const currentCenterY = titleRect.top + titleRect.height / 2;
            const targetCenterX = brandRect.left + brandRect.width / 2;
            const targetCenterY = brandRect.top + brandRect.height / 2;

            const deltaX = targetCenterX - currentCenterX;
            const deltaY = targetCenterY - currentCenterY;

            // Target scale matching brand font height
            const targetScale = Math.min(1, Math.max(0.35, brandRect.height / titleRect.height));

            // Smoothly glide title directly to the top-left corner
            preloaderTitle.style.transition = 'transform 0.85s cubic-bezier(0.16, 1, 0.3, 1)';
            preloaderTitle.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${targetScale})`;
        }

        // Fade out dark preloader backdrop
        preloader.classList.add('fade-out');

        // Step 3: Seamlessly dock into top-left siteBrand and remove preloader
        setTimeout(() => {
            if (siteBrand) {
                siteBrand.style.opacity = '1';
                siteBrand.style.transition = 'opacity 0.25s ease';
            }
            preloader.classList.add('hidden');
            // Trigger typewriter animation as brand docks
            startBrandTypewriter();
        }, 850);
    }, 850);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPreloader);
} else {
    initPreloader();
}

// ==========================================================================
// IDLE AUTO-SCROLL TO EXPLORE HUB RESOURCES (Silky Smooth Animation)
// ==========================================================================
function smoothScrollTo(targetY, duration = 1400) {
    const startY = window.pageYOffset || document.documentElement.scrollTop;
    const distance = targetY - startY;
    if (Math.abs(distance) < 5) return;

    let startTime = null;
    let isCancelled = false;

    function cancelScroll() {
        isCancelled = true;
        removeCancelListeners();
    }

    function removeCancelListeners() {
        ['wheel', 'touchstart', 'mousedown', 'keydown'].forEach(evt => {
            window.removeEventListener(evt, cancelScroll, { passive: true });
        });
    }

    ['wheel', 'touchstart', 'mousedown', 'keydown'].forEach(evt => {
        window.addEventListener(evt, cancelScroll, { passive: true });
    });

    // EaseInOutCubic for organic, fluid motion
    function easeInOutCubic(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function step(timestamp) {
        if (isCancelled) return;
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = easeInOutCubic(progress);

        window.scrollTo(0, startY + (distance * ease));

        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            removeCancelListeners();
        }
    }

    requestAnimationFrame(step);
}

function initIdleAutoScroll() {
    let idleTimer = null;
    let hasAutoScrolled = false;
    const idleTimeLimit = 7000; // 7s idle threshold

    function cleanup() {
        if (idleTimer) {
            clearTimeout(idleTimer);
            idleTimer = null;
        }
        ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel', 'scroll'].forEach(evt => {
            window.removeEventListener(evt, handleUserActivity, { passive: true });
        });
    }

    function handleUserActivity() {
        if (hasAutoScrolled) return;
        if (idleTimer) clearTimeout(idleTimer);

        idleTimer = setTimeout(() => {
            if (hasAutoScrolled) return;

            // Trigger only when on home view, near top of page, and only once
            if (!document.body.classList.contains('in-subview') && window.scrollY < 200) {
                const target = document.querySelector('.floating-nav-container') || document.getElementById('floatingCanvas');
                if (target) {
                    hasAutoScrolled = true;
                    cleanup(); // Run for the first time only
                    const rect = target.getBoundingClientRect();
                    const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
                    const targetY = Math.max(0, currentScrollY + rect.top - 40);
                    smoothScrollTo(targetY, 1400);
                }
            }
        }, idleTimeLimit);
    }

    ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel', 'scroll'].forEach(evt => {
        window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    handleUserActivity();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIdleAutoScroll);
} else {
    initIdleAutoScroll();
}


