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
    const signupLink = document.querySelector('.signup-link'); // New signup link in login modal
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (loginModal) {
                loginModal.style.display = 'flex'; // Show login modal first
            }
        });
    }

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('open');
        });
    }

    loginLink.addEventListener('click', (e) => {
        e.preventDefault();
        signupModal.style.display = 'none';
        loginModal.style.display = 'flex';
    });

    signupLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginModal.style.display = 'none';
        signupModal.style.display = 'flex';
    });

    [signupModal, loginModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    // Add enter key event listener
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && loginModal.style.display === 'flex') {
            e.preventDefault();
            document.getElementById('loginBtn').click();
        }
        if (e.key === 'Enter' && signupModal.style.display === 'flex') {
            e.preventDefault();
            document.getElementById('signupBtn').click();
        }
    }); 

    window.showTab = function(tabId, button) {
        const tabContents = document.querySelectorAll('.tab-content, .hero');
        tabContents.forEach(content => {
            content.classList.remove('active');
        });

        const tabButtons = document.querySelectorAll('.tab-btn, .nav-link');
        tabButtons.forEach(btn => {
            btn.classList.remove('active');
        });

        const selectedContent = document.getElementById(tabId);
        if (selectedContent) {
            selectedContent.classList.add('active');
        }

        const navLink = document.querySelector(`.nav-link[data-section="${tabId}"]`);
        if (navLink) {
            navLink.classList.add('active');
        }

        const tabButton = document.querySelector(`.tab-btn[onclick="showTab('${tabId}')"]`);
        if (tabButton) {
            tabButton.classList.add('active');
        }

        if (button) {
            button.classList.add('active');
        }

        selectedContent.scrollIntoView({ behavior: 'smooth' });
    };

    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('onclick').match(/showTab\('(.+)'\)/)[1];
            showTab(tabId, button);
        });
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            const tabId = link.getAttribute('data-section');
            showTab(tabId);
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