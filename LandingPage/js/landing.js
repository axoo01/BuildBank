import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@latest/+esm';

const supabase = createClient('https://smcyqxylufjgkmumhonk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtY3lxeHlsdWZqZ2ttdW1ob25rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MzUyNTgsImV4cCI6MjA2NDIxMTI1OH0.aRLFJCwe8WpMx1mXRmHWfnLH3XLi3af5Z1KeiJzAJNc');

let signupModal, loginModal;

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
            alert('Login error: ' + error.message);
        } else {
            alert('Login successful!');
            window.location.href = '/Dashboard/dashboard.html';
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

document.addEventListener('DOMContentLoaded', () => {
    signupModal = document.querySelector('#signup-modal');
    loginModal = document.querySelector('#login-modal');
    const getStartedBtn = document.querySelector('.get-started-btn');
    const loginLink = document.querySelector('.login-link');
    const signupLink = document.querySelector('.signup-link');
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (loginModal) loginModal.style.display = 'flex';
        });
    }

    if (hamburger && navLinks) {
        // Toggle sidebar on hamburger click
        hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = navLinks.classList.toggle('active');
            hamburger.classList.toggle('open', isActive);
            console.log('Hamburger clicked, nav-links active:', isActive);
        });

        // Close sidebar on menu item click - CONSOLIDATED INTO ONE EVENT LISTENER
        navLinks.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent default anchor behavior
                console.log('Menu item clicked:', link.textContent);
                
                // Close the navigation menu
                navLinks.classList.remove('active');
                hamburger.classList.remove('open');
                
                // Get the tab ID and show the tab
                const tabId = link.getAttribute('data-section');
                if (tabId) {
                    showTab(tabId);
                }
            });
        });

        // Close sidebar on outside click
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

    [signupModal, loginModal].forEach(modal => {
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

    // Only add event listeners to tab buttons (not nav-links to avoid duplication)
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

    // REMOVED DUPLICATE EVENT LISTENER FOR NAV-LINKS

    const initializeTab = () => {
        const hash = window.location.hash;
        let tab = hash === '#hero' ? 'hero' : hash.includes('about') ? 'about' : hash.includes('features') ? 'features' : 'hero';
        showTab(tab);
    };

    initializeTab();
    window.addEventListener('hashchange', initializeTab);
});