/**
 * Blog System for Tammy Yang's Personal Website
 * Handles blog listing page functionality including:
 * - Loading blog posts from static HTML files
 * - Rendering blog post cards
 * - Language switching with fallback to English
 */

// Configuration
const config = {
    htmlBlogPath: 'html_blogs',
    languages: ['en', 'zh-tw'],
    defaultLang: 'en',
    postsPerPage: 10
};

// State
let currentLanguage = localStorage.getItem('blog-language') || getBrowserLanguage() || config.defaultLang;
let blogPosts = [];
let fallbackActive = false;

// Hardcoded blog posts to solve local filesystem issues
// In a real web server environment, this would be generated dynamically
const availablePosts = {
    'en': [
        {
            slug: '250415',
            htmlFileName: '250415_en.html',
            language: 'en'
        }
    ],
    'zh-tw': [
        {
            slug: '250415',
            htmlFileName: '250415_zh-tw.html',
            language: 'zh-tw'
        }
    ]
};

// DOM elements
const blogGrid = document.getElementById('blogGrid');
const noPostsMessage = document.querySelector('.no-posts');
const langButtons = document.querySelectorAll('.lang-btn');

/**
 * Initialize the blog system
 */
async function initBlog() {
    // Set active language button based on stored preference
    setActiveLangButton();
    
    // Load posts for current language
    await loadBlogPosts();
    
    // Set up language toggle buttons
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
function setupLanguageToggle() {
    langButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const newLang = btn.getAttribute('data-lang');
            if (newLang !== currentLanguage) {
                currentLanguage = newLang;
                localStorage.setItem('blog-language', currentLanguage);
                setActiveLangButton();
                await loadBlogPosts();
            }
        });
    });
}

/**
 * Load blog posts for the current language
 */
async function loadBlogPosts() {
    try {
        fallbackActive = false;
        // First try to fetch posts in the current language
        let posts = await fetchBlogPosts(currentLanguage);
        
        // If no posts found and language is not English, fall back to English
        if ((!posts || posts.length === 0) && currentLanguage !== 'en') {
            fallbackActive = true;
            posts = await fetchBlogPosts('en');
            
            if (noPostsMessage) {
                noPostsMessage.style.display = 'block';
            }
        } else {
            if (noPostsMessage) {
                noPostsMessage.style.display = 'none';
            }
        }
        
        // Sort posts by date (newest first)
        blogPosts = posts.filter(post => post !== null).sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Render posts
        renderBlogPosts();
    } catch (error) {
        console.error('Error loading blog posts:', error);
        blogGrid.innerHTML = `<div class="no-posts">Error loading blog posts. Please try again later.</div>`;
    }
}

/**
 * Fetch blog posts for a specific language using the hardcoded list
 */
async function fetchBlogPosts(language) {
    try {
        // Get posts from the hardcoded list for the specified language
        const posts = availablePosts[language] || [];
        
        // For each post, fetch metadata from the HTML files
        const postsWithData = await Promise.all(
            posts.map(async post => {
                try {
                    // Extract metadata directly from the HTML file
                    const postData = await fetchPostMetadataFromHTML(`${config.htmlBlogPath}/${post.htmlFileName}`);
                    if (postData) {
                        return {
                            ...postData,
                            ...post,
                            htmlFile: `${config.htmlBlogPath}/${post.htmlFileName}`
                        };
                    }
                    return null;
                } catch (error) {
                    console.error(`Error fetching post ${post.htmlFileName}:`, error);
                    return null;
                }
            })
        );
        
        return postsWithData;
    } catch (error) {
        console.error(`Error fetching blog posts for ${language}:`, error);
        return [];
    }
}

/**
 * Fetch and extract metadata from an HTML blog post
 */
async function fetchPostMetadataFromHTML(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Failed to fetch post: ${filePath}`);
        }
        
        const html = await response.text();
        
        // Create a temporary element to parse the HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Extract metadata from the HTML
        const metadata = {
            title: extractTitle(tempDiv),
            date: extractDate(tempDiv),
            author: extractAuthor(tempDiv),
            summary: extractSummary(tempDiv),
            image: extractImage(tempDiv),
            tags: extractTags(tempDiv)
        };
        
        return metadata;
    } catch (error) {
        console.error(`Error fetching post data from ${filePath}:`, error);
        return null;
    }
}

/**
 * Extract title from HTML
 */
function extractTitle(htmlElement) {
    // Try to get it from the post-title element
    const titleElement = htmlElement.querySelector('.post-title');
    if (titleElement) return titleElement.textContent.trim();
    
    // Fallback to meta tags
    const metaTitle = htmlElement.querySelector('meta[property="og:title"]');
    if (metaTitle) {
        const title = metaTitle.getAttribute('content');
        return title.replace(' | Tammy Yang Blog', '');
    }
    
    // Final fallback to document title
    const titleTag = htmlElement.querySelector('title');
    if (titleTag) {
        return titleTag.textContent.replace(' | Tammy Yang Blog', '');
    }
    
    return 'Untitled Post';
}

/**
 * Extract date from HTML
 */
function extractDate(htmlElement) {
    const dateElement = htmlElement.querySelector('.post-date');
    if (dateElement) {
        const dateText = dateElement.textContent.trim();
        // Try to convert the formatted date back to ISO format
        try {
            // Different formats based on language
            if (dateText.includes('年')) {
                // Chinese format
                const match = dateText.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
                if (match) {
                    const [_, year, month, day] = match;
                    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                }
            } else {
                // English format - e.g., "April 15, 2025"
                const date = new Date(dateText);
                if (!isNaN(date.getTime())) {
                    return date.toISOString().split('T')[0];
                }
            }
        } catch (e) {
            console.error('Error parsing date:', e);
        }
    }
    
    // Fallback to current date
    return new Date().toISOString().split('T')[0];
}

/**
 * Extract author from HTML
 */
function extractAuthor(htmlElement) {
    const authorElement = htmlElement.querySelector('.post-author');
    if (authorElement) {
        return authorElement.textContent.trim().replace('Tammy Yang', '').trim() || 'Tammy Yang';
    }
    return 'Tammy Yang';
}

/**
 * Extract summary from HTML
 */
function extractSummary(htmlElement) {
    // Try to get from meta tags
    const metaSummary = htmlElement.querySelector('meta[property="og:description"], meta[name="twitter:description"]');
    if (metaSummary) {
        return metaSummary.getAttribute('content');
    }
    
    // Try to get from first paragraph
    const firstParagraph = htmlElement.querySelector('.post-content p');
    if (firstParagraph) {
        const text = firstParagraph.textContent.trim();
        return text.length > 150 ? text.substring(0, 147) + '...' : text;
    }
    
    return 'No summary available';
}

/**
 * Extract image from HTML
 */
function extractImage(htmlElement) {
    // Try to get from featured image
    const featuredImage = htmlElement.querySelector('.post-featured-img');
    if (featuredImage) {
        return featuredImage.getAttribute('src');
    }
    
    // Try to get from meta tags
    const metaImage = htmlElement.querySelector('meta[property="og:image"], meta[name="twitter:image"]');
    if (metaImage) {
        return metaImage.getAttribute('content');
    }
    
    return '';
}

/**
 * Extract tags from HTML
 */
function extractTags(htmlElement) {
    // We don't have visible tags in the HTML currently, but could add later
    // For now, just return a default tag
    return ['Blog'];
}

/**
 * Render blog posts as cards in the grid
 */
function renderBlogPosts() {
    if (blogGrid) {
        blogGrid.innerHTML = ''; // Clear existing content
        
        if (blogPosts.length === 0) {
            blogGrid.innerHTML = `<div class="no-posts">No blog posts found.</div>`;
            return;
        }
        
        blogPosts.forEach(post => {
            const postCard = createBlogPostCard(post);
            blogGrid.appendChild(postCard);
        });
    }
}

/**
 * Create a blog post card element
 */
function createBlogPostCard(post) {
    const card = document.createElement('div');
    card.className = 'blog-card';
    
    // Format date
    const postDate = new Date(post.date);
    const formattedDate = postDate.toLocaleDateString(currentLanguage === 'zh-tw' ? 'zh-TW' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Primary tag (first tag)
    const primaryTag = post.tags && post.tags.length > 0 ? post.tags[0] : 'Blog';
    
    // Default image if not specified
    const imageUrl = post.image || 'assets/tammy-logo.png';
    
    // Use the static HTML file instead of passing slug and lang parameters
    card.innerHTML = `
        <div class="blog-img" style="background-image: url('${imageUrl}')">
            <span class="blog-tag">${primaryTag}</span>
        </div>
        <div class="blog-info">
            <div class="blog-date">${formattedDate}</div>
            <h3 class="blog-card-title">${post.title}</h3>
            <p class="blog-excerpt">${post.summary}</p>
            <a href="${post.htmlFile}" class="blog-read-more">Read more</a>
        </div>
    `;
    
    return card;
}

// Initialize the blog when DOM is loaded
document.addEventListener('DOMContentLoaded', initBlog);
