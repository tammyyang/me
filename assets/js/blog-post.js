/**
 * Blog Post System for Tammy Yang's Personal Website
 * Handles individual blog post page functionality including:
 * - Loading and rendering posts from markdown files
 * - Language switching with fallback to English
 * - Syntax highlighting for code blocks
 */

// Configuration
const config = {
    blogPath: 'blogs',
    languages: ['en', 'zh-tw'],
    defaultLang: 'en'
};

// State
let currentLanguage = localStorage.getItem('blog-language') || getBrowserLanguage() || config.defaultLang;
let currentPost = null;
let fallbackActive = false;

// DOM elements
const postHeader = document.getElementById('postHeader');
const fallbackNotice = document.getElementById('fallbackNotice');
const featuredImageContainer = document.getElementById('featuredImageContainer');
const postContent = document.getElementById('postContent');
const langButtons = document.querySelectorAll('.lang-btn');

/**
 * Initialize the blog post page
 */
async function initBlogPost() {
    // Set active language button based on stored preference
    setActiveLangButton();
    
    // Get post slug and language from URL
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');
    const lang = urlParams.get('lang') || currentLanguage;
    
    if (!slug) {
        showErrorMessage('No post specified');
        return;
    }
    
    // If URL contains language parameter, update current language
    if (lang && lang !== currentLanguage) {
        currentLanguage = lang;
        localStorage.setItem('blog-language', currentLanguage);
        setActiveLangButton();
    }
    
    // Load and display the post
    await loadBlogPost(slug);
    
    // Set up language toggle buttons
    setupLanguageToggle(slug);
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
        if (btn.getAttribute('data-lang') === currentLanguage) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

/**
 * Set up language toggle buttons
 */
function setupLanguageToggle(slug) {
    langButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const newLang = btn.getAttribute('data-lang');
            if (newLang !== currentLanguage) {
                currentLanguage = newLang;
                localStorage.setItem('blog-language', currentLanguage);
                setActiveLangButton();
                await loadBlogPost(slug);
            }
        });
    });
}

/**
 * Load and display a blog post
 */
async function loadBlogPost(slug) {
    try {
        fallbackActive = false;
        
        // First try to load the post in the current language
        let post = await fetchPostBySlug(slug, currentLanguage);
        
        // If post not found and language is not English, fall back to English
        if (!post && currentLanguage !== 'en') {
            fallbackActive = true;
            post = await fetchPostBySlug(slug, 'en');
            
            if (fallbackNotice) {
                fallbackNotice.style.display = 'block';
            }
        } else {
            if (fallbackNotice) {
                fallbackNotice.style.display = 'none';
            }
        }
        
        // If post still not found, show error
        if (!post) {
            showErrorMessage('Post not found');
            return;
        }
        
        // Store current post
        currentPost = post;
        
        // Render the post
        renderBlogPost(post);
        
        // Update page title and meta tags
        updateMetaTags(post);
    } catch (error) {
        console.error('Error loading blog post:', error);
        showErrorMessage('Error loading blog post');
    }
}

/**
 * Fetch a blog post by slug and language
 */
async function fetchPostBySlug(slug, language) {
    try {
        const filePath = `${config.blogPath}/${language}/${slug}.md`;
        const response = await fetch(filePath);
        
        if (!response.ok) {
            return null;
        }
        
        const markdown = await response.text();
        const post = parsePostFrontMatter(markdown, filePath);
        
        return {
            ...post,
            language: language,
            slug: slug
        };
    } catch (error) {
        console.error(`Error fetching post ${slug} in ${language}:`, error);
        return null;
    }
}

/**
 * Parse front matter from a markdown post
 */
function parsePostFrontMatter(markdown, filePath) {
    // Check for YAML front matter (between --- markers)
    const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
    const match = markdown.match(frontMatterRegex);
    
    if (!match) {
        console.error(`No front matter found in ${filePath}`);
        return {
            title: 'Untitled Post',
            date: new Date().toISOString().split('T')[0],
            summary: 'No summary available',
            image: '',
            content: markdown
        };
    }
    
    const frontMatter = match[1];
    const content = markdown.slice(match[0].length);
    
    // Parse YAML front matter
    const metadata = {};
    const lines = frontMatter.split('\n');
    lines.forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length) {
            const value = valueParts.join(':').trim();
            // Handle array values like tags: [item1, item2]
            if (value.startsWith('[') && value.endsWith(']')) {
                metadata[key.trim()] = value
                    .slice(1, -1)
                    .split(',')
                    .map(item => item.trim());
            } else {
                metadata[key.trim()] = value;
            }
        }
    });
    
    return {
        ...metadata,
        content: content
    };
}

/**
 * Render the blog post
 */
function renderBlogPost(post) {
    // Render post header
    if (postHeader) {
        // Format date
        const postDate = new Date(post.date);
        const formattedDate = postDate.toLocaleDateString(currentLanguage === 'zh-tw' ? 'zh-TW' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        postHeader.innerHTML = `
            <h1 class="post-title">${post.title}</h1>
            <div class="post-meta">
                <div class="post-date">
                    <i class="far fa-calendar-alt"></i>
                    ${formattedDate}
                </div>
                <div class="post-author">
                    <i class="far fa-user"></i>
                    ${post.author || 'Tammy Yang'}
                </div>
            </div>
            <div class="language-toggle">
                <button class="lang-btn ${currentLanguage === 'en' ? 'active' : ''}" data-lang="en">English</button>
                <button class="lang-btn ${currentLanguage === 'zh-tw' ? 'active' : ''}" data-lang="zh-tw">中文</button>
            </div>
        `;
    }
    
    // Render featured image if it exists
    if (featuredImageContainer && post.image) {
        featuredImageContainer.innerHTML = `
            <img src="${post.image}" alt="${post.title}" class="post-featured-img">
        `;
    } else if (featuredImageContainer) {
        featuredImageContainer.innerHTML = '';
    }
    
    // Render post content
    if (postContent) {
        // Convert markdown to HTML using marked.js
        const htmlContent = marked.parse(post.content);
        postContent.innerHTML = htmlContent;
        
        // Apply syntax highlighting if Prism is available
        if (typeof Prism !== 'undefined') {
            Prism.highlightAllUnder(postContent);
        }
    }
}

/**
 * Update page title and meta tags
 */
function updateMetaTags(post) {
    // Update page title
    document.title = `${post.title} | Tammy Yang Blog`;
    
    // Update meta tags
    const metaTags = {
        'og:title': `${post.title} | Tammy Yang Blog`,
        'og:description': post.summary,
        'og:image': post.image,
        'twitter:title': `${post.title} | Tammy Yang Blog`,
        'twitter:description': post.summary,
        'twitter:image': post.image
    };
    
    for (const [key, value] of Object.entries(metaTags)) {
        if (value) {
            const metaTag = document.querySelector(`meta[property="${key}"]`) || 
                           document.querySelector(`meta[name="${key}"]`);
            if (metaTag) {
                metaTag.setAttribute('content', value);
            }
        }
    }
}

/**
 * Show error message
 */
function showErrorMessage(message) {
    if (postContent) {
        postContent.innerHTML = `
            <div style="text-align: center; padding: 50px 20px;">
                <h2 style="color: #666; margin-bottom: 20px;">${message}</h2>
                <p>Please go back to the <a href="blog.html" style="color: var(--bright-pink);">blog page</a> and try again.</p>
            </div>
        `;
    }
    
    if (postHeader) {
        postHeader.innerHTML = `
            <h1 class="post-title">Error</h1>
        `;
    }
    
    if (fallbackNotice) {
        fallbackNotice.style.display = 'none';
    }
}

/**
 * Share functions
 */
function shareOnTwitter() {
    if (!currentPost) return;
    
    const title = encodeURIComponent(currentPost.title);
    const url = encodeURIComponent(window.location.href);
    
    window.open(`https://twitter.com/intent/tweet?text=${title}&url=${url}`, '_blank');
}

function shareOnLinkedIn() {
    if (!currentPost) return;
    
    const url = encodeURIComponent(window.location.href);
    
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
}

// Initialize the blog post when DOM is loaded
document.addEventListener('DOMContentLoaded', initBlogPost);

// Expose share functions to global scope for use in HTML
window.shareOnTwitter = shareOnTwitter;
window.shareOnLinkedIn = shareOnLinkedIn;