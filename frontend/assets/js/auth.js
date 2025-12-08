// jQuery-based Authentication Functions
const API_BASE = 'https://dogfoodshop.ccs4thyear.com/api';

function getToken() {
    return localStorage.getItem('token');
}

function getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

function checkAuth() {
    const token = getToken();
    const user = getUser();
    
    if (!token || !user) {
        window.location.href = '../guest/login.html';
        return false;
    }
    
    $('#userName').text(`Welcome, ${user.first_name} ${user.last_name}`);
    return true;
}

function logout(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    const user = getUser();
    if (!user) {
        window.location.href = '../guest/login.html';
        return;
    }
    
    const userName = user.first_name || 'User';
    const logoutBtn = $(event ? event.target : 'button[onclick*="logout"]').first();
    
    // Check if SweetAlert is available
    const hasSwal = typeof Swal !== 'undefined' && Swal && typeof Swal.fire === 'function';
    
    // Show confirmation dialog
    Swal.fire({
        title: 'Logout?',
        html: `<div style="text-align: center;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">👋</div>
            <p style="font-size: 1.1rem; color: #64748b;">Are you sure you want to logout, <strong>${userName}</strong>?</p>
        </div>`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Yes, logout',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
        allowOutsideClick: false,
        allowEscapeKey: true
    }).then((result) => {
        if (!result.isConfirmed) {
            return;
        }
        
        // Show loading state
        if (logoutBtn.length) {
            logoutBtn.prop('disabled', true).html('<span class="loading-spinner"></span>Logging out...');
        }
        
        const token = getToken();
        
        // Call logout API using jQuery
        $.ajax({
            url: `${API_BASE}/auth/logout`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            success: function() {
                // Show success message
                Swal.fire({
                    title: 'Logged Out!',
                    html: `<div style="text-align: center;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">✅</div>
                        <p style="font-size: 1.1rem; color: #64748b; margin-bottom: 0.5rem;">You have been successfully logged out, <strong>${userName}</strong>!</p>
                        <p style="font-size: 1rem; color: #4f46e5; font-weight: 600; margin-top: 1rem; margin-bottom: 0.5rem;">Thank you for using Dog Food Shop! 🐕</p>
                        <p style="font-size: 0.9rem; color: #94a3b8; margin-top: 0.5rem;">We hope to see you again soon!</p>
                        <p style="font-size: 0.85rem; color: #cbd5e1; margin-top: 1rem;">Redirecting to login page...</p>
                    </div>`,
                    icon: 'success',
                    confirmButtonColor: '#10b981',
                    confirmButtonText: 'Continue',
                    timer: 2500,
                    timerProgressBar: true,
                    allowOutsideClick: false,
                    allowEscapeKey: false
                }).then(() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '../guest/login.html';
                });
            },
            error: function() {
                // Even if API fails, logout locally
                Swal.fire({
                    title: 'Logged Out!',
                    html: `<div style="text-align: center;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">✅</div>
                        <p style="font-size: 1.1rem; color: #64748b; margin-bottom: 0.5rem;">You have been successfully logged out, <strong>${userName}</strong>!</p>
                        <p style="font-size: 1rem; color: #4f46e5; font-weight: 600; margin-top: 1rem; margin-bottom: 0.5rem;">Thank you for using Dog Food Shop! 🐕</p>
                    </div>`,
                    icon: 'success',
                    confirmButtonColor: '#10b981',
                    timer: 2000
                }).then(() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '../guest/login.html';
                });
            }
        });
    });
}

function getAuthHeaders() {
    return {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
    };
}

// Keep content from sitting under the fixed navbar
function adjustBodyPaddingForNavbar() {
    const nav = document.querySelector('.navbar');
    if (!nav) return;
    const extra = 16; // breathing room
    document.body.style.paddingTop = `${nav.offsetHeight + extra}px`;
}

// Mobile navigation (hamburger) setup for dashboards
function setupMobileNav() {
    const navContainer = document.querySelector('.navbar .container');
    const navLinks = navContainer ? navContainer.querySelector('.nav-links') : null;
    const breakpoint = 900;

    if (!navContainer || !navLinks || navContainer.classList.contains('mobile-nav-ready')) {
        return;
    }

    navContainer.classList.add('mobile-nav-ready');

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'nav-toggle';
    toggleBtn.type = 'button';
    toggleBtn.setAttribute('aria-label', 'Toggle navigation menu');
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.innerHTML = '<span></span><span></span><span></span>';

    navContainer.insertBefore(toggleBtn, navLinks);

    const closeMenu = (instant = false) => {
        navLinks.classList.remove('open');
        toggleBtn.classList.remove('open');
        toggleBtn.setAttribute('aria-expanded', 'false');

        if (instant) {
            const previousTransition = navLinks.style.transition;
            navLinks.style.transition = 'none';
            // Force reflow to apply immediate close without animation
            void navLinks.offsetHeight;
            navLinks.style.transition = previousTransition;
        }
    };

    toggleBtn.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('open');
        toggleBtn.classList.toggle('open', isOpen);
        toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        adjustBodyPaddingForNavbar();
    });

    navLinks.querySelectorAll('a, button').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= breakpoint) {
                closeMenu();
            }
        });
    });

    navLinks.addEventListener('transitionend', adjustBodyPaddingForNavbar);

    window.addEventListener('resize', () => {
        if (window.innerWidth > breakpoint) {
            closeMenu(true);
        }
        adjustBodyPaddingForNavbar();
    });

    // initial padding set after nav setup
    adjustBodyPaddingForNavbar();
}

// Also run on DOMContentLoaded in case jQuery ready is delayed/blocked
document.addEventListener('DOMContentLoaded', setupMobileNav);
document.addEventListener('DOMContentLoaded', adjustBodyPaddingForNavbar);

// jQuery ready function for initialization
$(document).ready(function() {
    // Auto-check auth on page load if checkAuth function exists
    if (typeof checkAuth === 'function') {
        checkAuth();
    }

    setupMobileNav();
    adjustBodyPaddingForNavbar();
});
