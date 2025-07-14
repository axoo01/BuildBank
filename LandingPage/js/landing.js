import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@latest/+esm';

const supabase = createClient('https://smcyqxylufjgkmumhonk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtY3lxeHlsdWZqZ2ttdW1ob25rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MzUyNTgsImV4cCI6MjA2NDIxMTI1OH0.aRLFJCwe8WpMx1mXRmHWfnLH3XLi3af5Z1KeiJzAJNc');

let signupModal, loginModal, forgotPasswordModal;

async function signUpUser(email, password, name) {
    const signupError = document.getElementById('signup-error');
    const signupName = document.getElementById('signupName');
    const signupEmail = document.getElementById('signupEmail');
    const signupPassword = document.getElementById('signupPassword');
    try {
        // Validate inputs
        if (!name || !email || !password) {
            signupError.textContent = 'Please enter name, email, and password to sign up.';
            signupError.classList.add('active');
            return;
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name },
                emailRedirectTo: 'http://buildbank.netlify.app/LandingPage/index.html' // Base URL, no parameter
            }
        });
        if (error) {
            signupError.textContent = 'Signup error: ' + error.message;
            signupError.classList.add('active');
            throw error;
        }

        if (!data.user) {
            signupError.textContent = 'Signup successful! Please check your email to verify your account.';
            signupError.classList.remove('active');
            signupError.classList.add('success');
            // Clear input fields
            signupName.value = '';
            signupEmail.value = '';
            signupPassword.value = '';
            signupModal.style.display = 'none';
            loginModal.style.display = 'flex'; // Open login modal with message
            return;
        }

        const { error: insertError } = await supabase
            .from('users')
            .insert({
                id: data.user.id,
                email: data.user.email,
                name: name,
                created_at: new Date().toISOString()
            });

        if (insertError) {
            signupError.textContent = 'Failed to save user details: ' + insertError.message;
            signupError.classList.add('active');
            throw insertError;
        }

        signupError.textContent = 'Signup successful! Please check your email to verify your account.';
        signupError.classList.remove('active');
        signupError.classList.add('success');
        // Clear input fields
        signupName.value = '';
        signupEmail.value = '';
        signupPassword.value = '';
        signupModal.style.display = 'none';
        loginModal.style.display = 'flex'; // Open login modal with message
    } catch (err) {
        signupError.textContent = 'Unexpected error: ' + err.message;
        signupError.classList.add('active');
    }
}

async function loginUser(email, password) {
    const loginError = document.getElementById('login-error');
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    try {
        if (!email || !password) {
            loginError.textContent = 'Please enter both email and password to login.';
            loginError.classList.add('active');
            return;
        }

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            if (error.message.includes('Email not confirmed')) {
                loginError.textContent = 'Signup successful! Please confirm your email to log in.';
            } else if (error.message.includes('Invalid login credentials') || error.status === 400) {
                const { data: userExists } = await supabase
                    .from('users')
                    .select('email')
                    .eq('email', email)
                    .single();
                if (!userExists) {
                    loginError.textContent = 'No account exists with this email. Please sign up.';
                } else {
                    loginError.textContent = 'Invalid email or password. Please try again.';
                }
            } else {
                loginError.textContent = 'Login error: ' + error.message;
            }
            loginError.classList.add('active');
        } else {
            window.location.href = '/Dashboard/dashboard.html';
            // Clear input fields on success
            loginEmail.value = '';
            loginPassword.value = '';
        }
    } catch (err) {
        loginError.textContent = 'Unexpected error: ' + err.message;
        loginError.classList.add('active');
    }
}

async function resetPassword(email) {
    const forgotError = document.getElementById('forgot-error');
    try {
        // Validate input
        if (!email) {
            forgotError.textContent = 'Please enter your email to reset password.';
            forgotError.classList.add('active');
            return;
        }

        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'http://localhost:3000/LandingPage/index.html?showLogin=true'
        });
        if (error) {
            forgotError.textContent = 'Error sending reset link: ' + error.message;
            forgotError.classList.add('active');
        } else {
            forgotError.textContent = 'Password reset link sent to your email! Please check your inbox.';
            forgotError.classList.add('active');
            forgotPasswordModal.style.display = 'none';
            loginModal.style.display = 'flex';
        }
    } catch (err) {
        forgotError.textContent = 'Unexpected error: ' + err.message;
        forgotError.classList.add('active');
    }
}

document.getElementById('signupBtn')?.addEventListener('click', (event) => {
    event.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const signupError = document.getElementById('signup-error');
    signupError.classList.remove('active'); // Clear error on new attempt
    signUpUser(email, password, name);
}, false);

// Clear error on input focus
document.getElementById('signupName')?.addEventListener('focus', () => {
    const signupError = document.getElementById('signup-error');
    signupError.classList.remove('active');
});
document.getElementById('signupEmail')?.addEventListener('focus', () => {
    const signupError = document.getElementById('signup-error');
    signupError.classList.remove('active');
});
document.getElementById('signupPassword')?.addEventListener('focus', () => {
    const signupError = document.getElementById('signup-error');
    signupError.classList.remove('active');
});

document.getElementById('loginBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const loginError = document.getElementById('login-error');
    loginError.classList.remove('active'); // Clear error on new attempt
    loginUser(email, password);
}, false);

// Clear error on input focus
document.getElementById('loginEmail')?.addEventListener('focus', () => {
    const loginError = document.getElementById('login-error');
    loginError.classList.remove('active');
});
document.getElementById('loginPassword')?.addEventListener('focus', () => {
    const loginError = document.getElementById('login-error');
    loginError.classList.remove('active');
});

document.getElementById('resetPasswordBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    const email = document.getElementById('forgotEmail').value;
    const forgotError = document.getElementById('forgot-error');
    forgotError.classList.remove('active'); // Clear error on new attempt
    resetPassword(email);
}, false);

// Clear error on input focus
document.getElementById('forgotEmail')?.addEventListener('focus', () => {
    const forgotError = document.getElementById('forgot-error');
    forgotError.classList.remove('active');
});

document.addEventListener('DOMContentLoaded', () => {
    signupModal = document.querySelector('#signup-modal');
    loginModal = document.querySelector('#login-modal');
    forgotPasswordModal = document.querySelector('#forgot-password-modal');
    const getStartedBtn = document.querySelector('.get-started-btn');
    const loginLink = document.querySelector('.login-link');
    const signupLink = document.querySelector('.signup-link');
    const forgotPasswordLink = document.querySelector('.forgot-password');
    const backToLoginLink = document.querySelector('.back-to-login');
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const loginError = document.getElementById('login-error');

    // Check auth state on load
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session && session.user.email_confirmed_at) {
            loginError.textContent = 'Now you can log in.';
            loginError.classList.remove('active');
            loginError.classList.add('success');
        } else if (loginError.textContent === '') {
            loginError.textContent = 'Signup successful! Please confirm your email to log in.';
            loginError.classList.add('active');
        }
    });

    // Check for redirect parameter and show login modal
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('showLogin') === 'true') {
        const signupMessage = document.getElementById('signup-message');
        if (signupMessage) {
            signupMessage.style.display = 'block';
            setTimeout(() => signupMessage.style.display = 'none', 5000);
        }
        if (loginModal) {
            loginModal.style.display = 'flex';
            window.history.replaceState({}, document.title, window.location.pathname); // Clear query param
        }
    }

    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (loginModal) loginModal.style.display = 'flex';
        });
    }

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = navLinks.classList.toggle('active');
            hamburger.classList.toggle('open', isActive);
            console.log('Hamburger clicked, nav-links active:', isActive);
        });

        navLinks.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Menu item clicked:', link.textContent);
                navLinks.classList.remove('active');
                hamburger.classList.remove('open');
                const tabId = link.getAttribute('data-section');
                if (tabId) {
                    showTab(tabId);
                }
            });
        });

        document.addEventListener('click', (e) => {
            if (navLinks.classList.contains('active') && !navLinks.contains(e.target) && !hamburger.contains(e.target)) {
                console.log('Clicked outside sidebar');
                navLinks.classList.remove('active');
                hamburger.classList.remove('open');
            }
        });
    }

    if (loginLink) {
        loginLink.addEventListener('click', (e) => {
            e.preventDefault();
            signupModal.style.display = 'none';
            loginModal.style.display = 'flex';
        });
    }

    if (signupLink) {
        signupLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginModal.style.display = 'none';
            signupModal.style.display = 'flex';
        });
    }

    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginModal.style.display = 'none';
            forgotPasswordModal.style.display = 'flex';
        });
    }

    if (backToLoginLink) {
        backToLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            forgotPasswordModal.style.display = 'none';
            loginModal.style.display = 'flex';
        });
    }

    [signupModal, loginModal, forgotPasswordModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.style.display = 'none';
            });
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && loginModal && loginModal.style.display === 'flex') {
            e.preventDefault();
            const loginBtn = document.getElementById('loginBtn');
            if (loginBtn) loginBtn.click();
        }
        if (e.key === 'Enter' && signupModal && signupModal.style.display === 'flex') {
            e.preventDefault();
            const signupBtn = document.getElementById('signupBtn');
            if (signupBtn) signupBtn.click();
        }
        if (e.key === 'Enter' && forgotPasswordModal && forgotPasswordModal.style.display === 'flex') {
            e.preventDefault();
            const resetBtn = document.getElementById('resetPasswordBtn');
            if (resetBtn) resetBtn.click();
        }
    });

    window.showTab = function(tabId, button) {
        const tabContents = document.querySelectorAll('.tab-content, .hero');
        tabContents.forEach(content => content.classList.remove('active'));
        const tabButtons = document.querySelectorAll('.tab-btn, .nav-link');
        tabButtons.forEach(btn => btn.classList.remove('active'));
        const selectedContent = document.getElementById(tabId);
        if (selectedContent) selectedContent.classList.add('active');
        const navLink = document.querySelector(`.nav-link[data-section="${tabId}"]`);
        if (navLink) navLink.classList.add('active');
        const tabButton = document.querySelector(`.tab-btn[onclick="showTab('${tabId}')"]`);
        if (tabButton) tabButton.classList.add('active');
        if (selectedContent) {
            selectedContent.scrollIntoView({ behavior: 'smooth' });
        }
    };

    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', () => {
            const onclickAttr = button.getAttribute('onclick');
            if (onclickAttr) {
                const match = onclickAttr.match(/showTab\('(.+)'\)/);
                if (match) {
                    const tabId = match[1];
                    showTab(tabId, button);
                }
            }
        });
    });

    const initializeTab = () => {
        const hash = window.location.hash;
        let tab = hash === '#hero' ? 'hero' : hash.includes('about') ? 'about' : hash.includes('features') ? 'features' : 'hero';
        showTab(tab);
    };

    initializeTab();
    window.addEventListener('hashchange', initializeTab);
});