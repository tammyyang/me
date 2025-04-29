/**
 * Blog Post System for Tammy Yang's Personal Website
 * Handles individual blog post page functionality including:
 * - Loading blog post content from pregenerated HTML files
 * - Language switching
 */

// Configuration
const config = {
    htmlBlogPath: 'html_blogs',
    languages: ['en', 'zh-tw'],
    defaultLang: 'en'
};

// State
let currentLanguage = localStorage.getItem('blog-language') || getBrowserLanguage() || config.defaultLang;

// DOM elements
const langButtons = document.querySelectorAll('.lang-btn');

/**
 * Initialize the blog post page
 */
function initBlogPost() {
    // Set active language button based on stored preference
    setActiveLangButton();
    
    // Set up language toggle buttons for static HTML files
    setupLanguageToggle();
}

/**
 * Get preferred language from browser
 */
function getBrowserLanguage() {
    const lang = navigator.language || navigator.userLanguage;
    if (lang.startsWith('zh')) return 'zh-tw';
    return 'en';
}

/**
 * Set the active language button based on current language
 */
function setActiveLangButton() {
    langButtons.forEach(btn => {
        const btnLang = btn.getAttribute('data-lang');
        if (btnLang === currentLanguage) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

/**
 * Set up language toggle buttons - static version using direct links
 */
function setupLanguageToggle() {
    // The onclick handlers are now being set in the HTML itself during static page generation
    // This is just for updating the active state of the buttons
    langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const newLang = btn.getAttribute('data-lang');
            if (newLang !== currentLanguage) {
                currentLanguage = newLang;
                localStorage.setItem('blog-language', currentLanguage);
                setActiveLangButton();
                // The page navigation is handled by the onclick attribute in the HTML
            }
        });
    });
}

// Share functions - keeping these for the onclick handlers in the HTML
function shareOnTwitter() {
    const title = encodeURIComponent(document.title);
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${title}&url=${url}`, '_blank');
}

function shareOnLinkedIn() {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
}

// Initialize the blog post when DOM is loaded
document.addEventListener('DOMContentLoaded', initBlogPost);

// Expose share functions to global scope for use in HTML
window.shareOnTwitter = shareOnTwitter;
window.shareOnLinkedIn = shareOnLinkedIn;