/**
 * Blog System for Tammy Yang's Personal Website
 * Handles blog listing page functionality including:
 * - Loading blog posts from static HTML files
 * - Rendering blog post cards
 * - Language switching with fallback to English
 */

// Configuration
const config = {
    blogPath: 'blogs',
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
            fileName: '250415.md',
            htmlFileName: '250415_en.html',
            language: 'en'
        }
    ],
    'zh-tw': [
        {
            slug: '250415',
            fileName: '250415.md',
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
        
        // For each post, fetch and parse the front matter
        const postsWithData = await Promise.all(
            posts.map(async post => {
                try {
                    // Try to fetch post data from the markdown file first for metadata
                    // This is needed for post cards (title, summary, etc.)
                    const postData = await fetchPostData(`${config.blogPath}/${language}/${post.fileName}`);
                    if (postData) {
                        return {
                            ...postData,
                            ...post,
                            htmlFile: `${config.htmlBlogPath}/${post.slug}_${language}.html`
                        };
                    }
                    return null;
                } catch (error) {
                    console.error(`Error fetching post ${post.fileName}:`, error);
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
 * Fetch and parse a blog post to extract front matter metadata
 */
async function fetchPostData(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Failed to fetch post: ${filePath}`);
        }
        
        const markdown = await response.text();
        return parsePostFrontMatter(markdown, filePath);
    } catch (error) {
        console.error(`Error fetching post data from ${filePath}:`, error);
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
        content: content,
        slug: filePath.split('/').pop().replace('.md', '')
    };
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