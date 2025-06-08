import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@latest/+esm';

const supabase = createClient('https://smcyqxylufjgkmumhonk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtY3lxeHlsdWZqZ2ttdW1ob25rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MzUyNTgsImV4cCI6MjA2NDIxMTI1OH0.aRLFJCwe8WpMx1mXRmHWfnLH3XLi3af5Z1KeiJzAJNc');

let signupModal, loginModal, forgotPasswordModal;

async function signUpUser(email, password, name) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name }
            }
        });
        if (error) {
            alert('Signup error: ' + error.message);
            throw error;
        }

        if (!data.user) {
            alert('Signup successful, but user data not available. Please confirm your email and log in.');
            signupModal.style.display = 'none';
            loginModal.style.display = 'flex';
            return;
        }

        // Insert a new record into public.users
        const { error: insertError } = await supabase
            .from('users')
            .insert({
                id: data.user.id,
                email: data.user.email,
                name: name,
                created_at: new Date().toISOString()
            });

        if (insertError) {
            alert('Failed to save user details: ' + insertError.message);
            throw insertError;
        }

        alert('Signup successful! Now log in to view the dashboard.');
        if (!signupModal || !loginModal) {
            alert('Modal elements not found');
        }
        signupModal.style.display = 'none';
        loginModal.style.display = 'flex';
    } catch (err) {
        alert('Unexpected error: ' + err.message);
    }
}

async function loginUser(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            if (error.message.includes('Invalid login credentials') || error.status === 400) {
                const { data: userExists } = await supabase
                    .from('users')
                    .select('email')
                    .eq('email', email)
                    .single();
                if (!userExists) {
                    alert('No account exists with this email. Please sign up.');
                } else {
                    alert('Invalid email or password. Please try again.');
                }
            } else {
                alert('Login error: ' + error.message);
            }
        } else {
            alert('Login successful!');
            window.location.href = '/Dashboard/dashboard.html';
        }
    } catch (err) {
        alert('Unexpected error: ' + err.message);
    }
}

async function resetPassword(email) {
    try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'https://buildbank.netlify.app//LandingPage/reset-password.html' // Replace with your reset page URL
        });
        if (error) {
            alert('Error sending reset link: ' + error.message);
        } else {
            alert('Password reset link sent to your email! Please check your inbox.');
            forgotPasswordModal.style.display = 'none';
            loginModal.style.display = 'flex';
        }
    } catch (err) {
        alert('Unexpected error: ' + err.message);
    }
}

document.getElementById('signupBtn')?.addEventListener('click', (event) => {
    event.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    signUpUser(email, password, name);
}, false);

document.getElementById('loginBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    loginUser(email, password);
}, false);

document.getElementById('resetPasswordBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    const email = document.getElementById('forgotEmail').value;
    if (email) {
        resetPassword(email);
    } else {
        alert('Please enter your email.');
    }
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
        if (button) button.classList.add('active');
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