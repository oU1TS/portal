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

// Smooth scrolling for navigation links
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        // Check if it's an anchor link for scrolling
        if (link.getAttribute('href').startsWith('#')) {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
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
