// Authentication Module for oU1TS Portal

const Auth = {
    currentUser: null,

    // Initialize auth state
    async init() {
        const supabase = window.supabaseClient;
        
        // Check if Supabase client is available
        if (!supabase) {
            console.error('Supabase client not initialized. Auth features disabled.');
            this.updateUI();
            return;
        }

        try {
            // Check for existing session
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                await this.setUser(session.user);
            }

            // Listen for auth changes
            supabase.auth.onAuthStateChange(async (event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    await this.setUser(session.user);
                } else if (event === 'SIGNED_OUT') {
                    this.clearUser();
                }
            });
        } catch (error) {
            console.error('Auth initialization error:', error);
        }

        this.updateUI();
    },

    // Set current user and fetch profile
    async setUser(user) {
        const supabase = window.supabaseClient;
        if (!supabase) return;
        
        // Fetch profile data
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('student_id, email')
            .eq('id', user.id)
            .single();

        // If profile doesn't exist (OAuth user), create it
        if (error && error.code === 'PGRST116') {
            const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                    id: user.id,
                    student_id: user.user_metadata?.student_id || 'OAUTH_USER',
                    email: user.email
                });

            if (insertError) {
                console.error('Failed to create profile:', insertError);
            }
        } else if (error) {
            console.error('Failed to fetch profile:', error);
        }

        const rawStudentId = profile?.student_id || user.user_metadata?.student_id || null;
        const needsStudentId = !rawStudentId || rawStudentId === 'OAUTH_USER';
        const displayStudentId = needsStudentId ? 'Google User' : rawStudentId;

        this.currentUser = {
            id: user.id,
            email: user.email,
            studentId: displayStudentId
        };

        this.updateUI();

        if (needsStudentId) {
            openAuthModal('complete-profile');
        }
    },

    // Clear user data
    clearUser() {
        this.currentUser = null;
        this.updateUI();
    },

    // Validate student ID (at least 10 digits)
    validateStudentId(studentId) {
        const digitsOnly = studentId.replace(/\D/g, '');
        return digitsOnly.length >= 10;
    },

    // Update student ID for current user
    async updateStudentId(studentId) {
        const supabase = window.supabaseClient;
        if (!supabase) throw new Error('Authentication service unavailable. Please refresh the page.');

        if (!this.currentUser?.id) {
            throw new Error('No active user session found.');
        }

        const digitsOnly = studentId.replace(/\D/g, '');
        if (!this.validateStudentId(digitsOnly)) {
            throw new Error('Student ID must be at least 10 digits');
        }

        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: this.currentUser.id,
                student_id: digitsOnly,
                email: this.currentUser.email
            }, { onConflict: 'id' });

        if (error) throw error;

        this.currentUser.studentId = digitsOnly;
        this.updateUI();
    },

    // Register new user
    async register(studentId, email, password) {
        const supabase = window.supabaseClient;
        if (!supabase) throw new Error('Authentication service unavailable. Please refresh the page.');

        // Validate student ID
        if (!this.validateStudentId(studentId)) {
            throw new Error('Student ID must be at least 10 digits');
        }

        // Validate email
        if (!email || !email.includes('@')) {
            throw new Error('Please enter a valid email');
        }

        // Validate password
        if (!password || password.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }

        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    student_id: studentId
                }
            }
        });

        if (error) throw error;
        return data;
    },

    // Login user
    async login(email, password) {
        const supabase = window.supabaseClient;
        if (!supabase) throw new Error('Authentication service unavailable. Please refresh the page.');

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;
        return data;
    },

    // Login with Google OAuth
    async loginWithGoogle() {
        const supabase = window.supabaseClient;
        if (!supabase) throw new Error('Authentication service unavailable. Please refresh the page.');

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.href,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent'
                }
            }
        });

        if (error) throw error;
        return data;
    },

    // Logout user
    async logout() {
        const supabase = window.supabaseClient;
        if (!supabase) throw new Error('Authentication service unavailable. Please refresh the page.');
        
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    // Update UI based on auth state
    updateUI() {
        const authBtn = document.getElementById('authBtn');
        const userInfo = document.getElementById('userInfo');
        const userDetails = document.getElementById('userDetails');
        const logoutBtn = document.getElementById('logoutBtn');

        if (!authBtn) return; // Not on a page with auth UI

        if (this.currentUser) {
            // User is logged in
            authBtn.style.display = 'none';
            if (userInfo) {
                userInfo.style.display = 'flex';
                if (userDetails) {
                    userDetails.innerHTML = `
                        <span class="user-id">${this.currentUser.studentId}</span>
                        <span class="user-email">${this.currentUser.email}</span>
                    `;
                }
            }
        } else {
            // User is logged out
            authBtn.style.display = 'flex';
            if (userInfo) {
                userInfo.style.display = 'none';
            }
        }

        // Update star buttons visibility
        this.updateStarButtons();
    },

    // Show/hide star buttons based on auth state
    updateStarButtons() {
        const starButtons = document.querySelectorAll('.star-btn');
        starButtons.forEach(btn => {
            if (this.currentUser) {
                btn.classList.remove('disabled');
                btn.title = 'Click to star this resource';
            } else {
                btn.classList.add('disabled');
                btn.title = 'Login to star resources';
            }
        });
    },

    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null;
    }
};

// Modal functions
function openAuthModal(mode = 'login') {
    const modal = document.getElementById('authModal');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const completeProfileForm = document.getElementById('completeProfileForm');
    const modalTitle = document.getElementById('authModalTitle');
    const googleBtn = document.getElementById('googleLoginBtn');
    const authDivider = document.querySelector('.auth-divider');
    const closeBtn = modal ? modal.querySelector('.auth-modal-close') : null;

    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        if (mode === 'login') {
            modalTitle.textContent = 'Login';
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            if (completeProfileForm) completeProfileForm.style.display = 'none';
            if (googleBtn) googleBtn.style.display = 'flex';
            if (authDivider) authDivider.style.display = 'flex';
            if (closeBtn) closeBtn.style.display = 'flex';
        } else if (mode === 'register') {
            modalTitle.textContent = 'Register';
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            if (completeProfileForm) completeProfileForm.style.display = 'none';
            if (googleBtn) googleBtn.style.display = 'flex';
            if (authDivider) authDivider.style.display = 'flex';
            if (closeBtn) closeBtn.style.display = 'flex';
        } else if (mode === 'complete-profile') {
            modalTitle.textContent = 'Add Student ID';
            loginForm.style.display = 'none';
            registerForm.style.display = 'none';
            if (completeProfileForm) completeProfileForm.style.display = 'block';
            if (googleBtn) googleBtn.style.display = 'none';
            if (authDivider) authDivider.style.display = 'none';
            if (closeBtn) closeBtn.style.display = 'none';
        }
    }
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        clearAuthErrors();
    }
}

function switchAuthMode(mode) {
    openAuthModal(mode);
}

function showAuthError(message) {
    const errorDiv = document.getElementById('authError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

function showAuthSuccess(message) {
    const successDiv = document.getElementById('authSuccess');
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.style.display = 'block';
    }
}

function clearAuthErrors() {
    const errorDiv = document.getElementById('authError');
    const successDiv = document.getElementById('authSuccess');
    if (errorDiv) errorDiv.style.display = 'none';
    if (successDiv) successDiv.style.display = 'none';
}

// Form submission handlers
async function handleLogin(e) {
    e.preventDefault();
    clearAuthErrors();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';

        await Auth.login(email, password);
        closeAuthModal();
        
        // Reload stars if on a resource page
        if (typeof Stars !== 'undefined') {
            Stars.loadStars();
        }
    } catch (error) {
        showAuthError(error.message || 'Login failed. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
    }
}

async function handleRegister(e) {
    e.preventDefault();
    clearAuthErrors();

    const studentId = document.getElementById('registerStudentId').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');

    // Validate passwords match
    if (password !== confirmPassword) {
        showAuthError('Passwords do not match');
        return;
    }

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating account...';

        await Auth.register(studentId, email, password);
        showAuthSuccess('Account created! You can now login.');
        
        // Switch to login form after short delay
        setTimeout(() => {
            switchAuthMode('login');
        }, 2000);
    } catch (error) {
        showAuthError(error.message || 'Registration failed. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Register';
    }
}

async function handleCompleteProfile(e) {
    e.preventDefault();
    clearAuthErrors();

    const studentId = document.getElementById('completeStudentId').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';

        await Auth.updateStudentId(studentId);
        showAuthSuccess('Student ID saved successfully.');

        setTimeout(() => {
            closeAuthModal();
        }, 600);
    } catch (error) {
        showAuthError(error.message || 'Failed to save Student ID. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Student ID';
    }
}

async function handleProfileLogout() {
    try {
        await Auth.logout();
        closeAuthModal();
    } catch (error) {
        console.error('Logout error:', error);
    }
}

async function handleLogout() {
    try {
        await Auth.logout();
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Google OAuth handler
async function handleGoogleLogin() {
    clearAuthErrors();
    const googleBtn = document.getElementById('googleLoginBtn');
    
    try {
        if (googleBtn) {
            googleBtn.disabled = true;
            googleBtn.innerHTML = '<i class="fa-brands fa-google"></i> Connecting...';
        }
        
        await Auth.loginWithGoogle();
        // OAuth redirects, so this won't execute unless there's an error
    } catch (error) {
        showAuthError(error.message || 'Google login failed. Please try again.');
        if (googleBtn) {
            googleBtn.disabled = false;
            googleBtn.innerHTML = '<i class="fa-brands fa-google"></i> Continue with Google';
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for Supabase to be ready
    if (window.supabaseClient) {
        Auth.init();
    } else {
        // Retry after a short delay
        setTimeout(() => {
            if (window.supabaseClient) {
                Auth.init();
            }
        }, 500);
    }
});

// Export for use in other modules
window.Auth = Auth;
