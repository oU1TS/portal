// Reusable Auth Modal Injection Script for oU1TS Portal
(function() {
    const modalHTML = `
    <!-- Auth Modal -->
    <div class="auth-modal" id="authModal">
        <div class="auth-modal-content">
            <button class="auth-modal-close" onclick="closeAuthModal()">
                <i class="fa-solid fa-xmark"></i>
            </button>
            <h2 id="authModalTitle">Login</h2>

            <div id="authError" class="auth-error"></div>
            <div id="authSuccess" class="auth-success"></div>

            <!-- Google OAuth Button -->
            <button type="button" id="googleLoginBtn" class="google-login-btn" onclick="handleGoogleLogin()">
                <i class="fa-brands fa-google"></i>
                Continue with Google
            </button>

            <div class="auth-divider">
                <span>or continue with email</span>
            </div>

            <!-- Login Form -->
            <form id="loginForm" onsubmit="handleLogin(event)">
                <div class="form-group">
                    <label for="loginEmail">Email</label>
                    <input type="email" id="loginEmail" required placeholder="your@email.com">
                </div>
                <div class="form-group">
                    <label for="loginPassword">Password</label>
                    <input type="password" id="loginPassword" required placeholder="Your password">
                </div>
                <button type="submit" class="auth-submit-btn">Login</button>
                <p class="auth-switch">
                    Don't have an account?
                    <a href="#" onclick="switchAuthMode('register'); return false;">Register</a>
                </p>
            </form>

            <!-- Complete Profile Form (Google OAuth) -->
            <form id="completeProfileForm" style="display: none;" onsubmit="handleCompleteProfile(event)">
                <p class="auth-switch">Please add your Student ID to continue.</p>
                <div class="form-group">
                    <label for="completeStudentId">Student ID</label>
                    <input type="text" id="completeStudentId" required placeholder="At least 10 digits"
                        pattern="\\d{10,}">
                </div>
                <button type="submit" class="auth-submit-btn">Save Student ID</button>
                <button type="button" class="auth-secondary-btn" onclick="handleProfileLogout()">Logout</button>
            </form>

            <!-- Register Form -->
            <form id="registerForm" style="display: none;" onsubmit="handleRegister(event)">
                <div class="form-group">
                    <label for="registerStudentId">Student ID</label>
                    <input type="text" id="registerStudentId" required placeholder="At least 10 digits"
                        pattern="\\d{10,}">
                </div>
                <div class="form-group">
                    <label for="registerEmail">Email</label>
                    <input type="email" id="registerEmail" required placeholder="your@email.com">
                </div>
                <div class="form-group">
                    <label for="registerPassword">Password</label>
                    <input type="password" id="registerPassword" required minlength="6" placeholder="Min 6 characters">
                </div>
                <div class="form-group">
                    <label for="registerConfirmPassword">Confirm Password</label>
                    <input type="password" id="registerConfirmPassword" required placeholder="Confirm password">
                </div>
                <button type="submit" class="auth-submit-btn">Register</button>
                <p class="auth-switch">
                    Already have an account?
                    <a href="#" onclick="switchAuthMode('login'); return false;">Login</a>
                </p>
            </form>
        </div>
    </div>
    `;

    function injectModal() {
        if (!document.getElementById('authModal')) {
            document.body.insertAdjacentHTML('afterbegin', modalHTML);
        }
    }

    if (document.body) {
        injectModal();
    } else {
        document.addEventListener('DOMContentLoaded', injectModal);
    }
})();
