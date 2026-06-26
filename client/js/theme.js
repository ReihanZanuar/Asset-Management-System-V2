/**
 * Theme Manager for AMS-SMK Application
 * Handles dark/light mode toggling with localStorage persistence
 * Enhanced with circular reveal animation from toggle button position
 */

const THEME_KEY = 'ams-theme';
const THEME_DARK = 'dark';
const THEME_LIGHT = 'light';
const DEFAULT_THEME = THEME_LIGHT;
const ANIMATION_DURATION = 600; // 0.6s - smooth iOS-like feel

/**
 * Get current theme from localStorage or return default
 */
function getTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    return stored || DEFAULT_THEME;
}

/**
 * Set theme and update DOM (without animation)
 */
function setTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
    
    if (theme === THEME_DARK) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

/**
 * Toggle between dark and light themes (simple version without animation)
 */
function toggleTheme() {
    const current = getTheme();
    const newTheme = current === THEME_DARK ? THEME_LIGHT : THEME_DARK;
    setTheme(newTheme);
}

/**
 * Toggle theme with circular reveal animation from button position
 * @param {MouseEvent|TouchEvent} event - Click/touch event from toggle button
 */
async function toggleThemeWithAnimation(event) {
    // Prevent multiple animations from running simultaneously
    if (document.body.classList.contains('theme-transitioning')) {
        return;
    }
    
    // Get click/touch position
    const x = event.clientX || (event.touches && event.touches[0].clientX) || window.innerWidth / 2;
    const y = event.clientY || (event.touches && event.touches[0].clientY) || window.innerHeight / 2;
    
    // Mark as transitioning
    document.body.classList.add('theme-transitioning');
    
    try {
        // Check for View Transitions API support (Chrome 111+, Edge 111+)
        if (document.startViewTransition && !navigator.userAgent.includes('Firefox')) {
            await useViewTransitionsAPI();
        } else {
            // Fallback for Firefox, Safari, older browsers
            await useCustomCircularReveal(x, y);
        }
    } finally {
        // Remove transitioning flag
        document.body.classList.remove('theme-transitioning');
    }
}

/**
 * Use native View Transitions API (modern browsers)
 */
function useViewTransitionsAPI() {
    return new Promise((resolve) => {
        const transition = document.startViewTransition(() => {
            toggleTheme();
        });
        
        transition.finished.then(resolve).catch(resolve);
    });
}

/**
 * Custom circular reveal animation using CSS clip-path (fallback)
 */
function useCustomCircularReveal(x, y) {
    return new Promise((resolve) => {
        const current = getTheme();
        const newTheme = current === THEME_DARK ? THEME_LIGHT : THEME_DARK;
        
        // Calculate radius needed to cover entire screen
        const endRadius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y)
        );
        
        // Create overlay with new theme colors
        const overlay = document.createElement('div');
        overlay.className = 'theme-transition-overlay';
        overlay.style.setProperty('--x', `${x}px`);
        overlay.style.setProperty('--y', `${y}px`);
        overlay.style.setProperty('--end-radius', `${endRadius}px`);
        
        // Set overlay color based on target theme
        if (newTheme === THEME_DARK) {
            overlay.style.backgroundColor = '#0F172A'; // Dark mode background
        } else {
            overlay.style.backgroundColor = '#f7f9fb'; // Light mode background
        }
        
        document.body.appendChild(overlay);
        
        // Trigger animation
        requestAnimationFrame(() => {
            overlay.style.animation = `circularReveal ${ANIMATION_DURATION}ms ease-in-out forwards`;
        });
        
        // Toggle theme at optimal point for smooth transition
        setTimeout(() => {
            setTheme(newTheme);
        }, ANIMATION_DURATION * 0.4);
        
        // Clean up after animation
        setTimeout(() => {
            overlay.remove();
            resolve();
        }, ANIMATION_DURATION);
    });
}

/**
 * Initialize theme on page load
 * Call this immediately when page loads
 */
function initTheme() {
    const theme = getTheme();
    setTheme(theme);
}

// Initialize theme immediately (before page render to prevent flash)
initTheme();

// Explicitly expose functions to global scope for onclick handlers
window.toggleTheme = toggleTheme;
window.toggleThemeWithAnimation = toggleThemeWithAnimation;
