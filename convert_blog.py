#!/usr/bin/env python3
"""
Blog Markdown to HTML Converter for Tammy Yang's Personal Website

This script converts Markdown blog posts with YAML front matter to static HTML files
using the blog-post.html template. This allows blog posts to be viewed directly on GitHub
without requiring client-side JavaScript to load and render the Markdown content.

Usage:
    python convert_blog.py [--all] [--post SLUG] [--language LANG]

Options:
    --all           Convert all blog posts in all languages
    --post SLUG     Convert a specific blog post by slug (e.g., 250415)
    --language LANG Convert posts for a specific language (en or zh-tw)

Examples:
    python convert_blog.py --all
    python convert_blog.py --post 250415
    python convert_blog.py --post 250415 --language en

Author: Tammy Yang
Date: April 29, 2025
"""

import os
import re
import sys
import argparse
import datetime
import shutil
from pathlib import Path

# Optional imports if you have them installed
try:
    import yaml
    YAML_AVAILABLE = True
except ImportError:
    YAML_AVAILABLE = False

try:
    import markdown
    MARKDOWN_AVAILABLE = True
except ImportError:
    MARKDOWN_AVAILABLE = False

# Configuration
CONFIG = {
    'blog_path': 'blogs',
    'output_path': 'html_blogs',
    'template_path': 'blog-post.html',
    'languages': ['en', 'zh-tw'],
    'default_lang': 'en'
}

def parse_front_matter(markdown_content, file_path):
    """Parse YAML front matter from a markdown post"""
    # Check for YAML front matter (between --- markers)
    front_matter_regex = r'^---\s*\n([\s\S]*?)\n---\s*\n'
    match = re.match(front_matter_regex, markdown_content)
    
    if not match:
        print(f"Warning: No front matter found in {file_path}")
        return {
            'title': 'Untitled Post',
            'date': datetime.date.today().isoformat(),
            'summary': 'No summary available',
            'image': '',
            'content': markdown_content
        }, markdown_content
    
    front_matter = match.group(1)
    content = markdown_content[match.end():]
    
    # Parse YAML front matter
    metadata = {}
    
    # Use PyYAML if available
    if YAML_AVAILABLE:
        try:
            metadata = yaml.safe_load(front_matter)
        except Exception as e:
            print(f"Error parsing YAML front matter: {e}")
            # Fallback to manual parsing
            metadata = parse_yaml_manually(front_matter)
    else:
        # Manual parsing if PyYAML not available
        metadata = parse_yaml_manually(front_matter)
    
    # Ensure all required fields exist
    metadata.setdefault('title', 'Untitled Post')
    metadata.setdefault('date', datetime.date.today().isoformat())
    metadata.setdefault('author', 'Tammy Yang')
    metadata.setdefault('summary', '')
    metadata.setdefault('image', '')
    metadata.setdefault('tags', [])
    
    return metadata, content

def parse_yaml_manually(yaml_text):
    """Manually parse YAML text without using PyYAML"""
    metadata = {}
    lines = yaml_text.split('\n')
    
    for line in lines:
        if ':' not in line:
            continue
            
        # Split at first colon
        parts = line.split(':', 1)
        if len(parts) != 2:
            continue
            
        key = parts[0].strip()
        value = parts[1].strip()
        
        # Handle array values like tags: [item1, item2]
        if value.startswith('[') and value.endswith(']'):
            value = value[1:-1]
            metadata[key] = [item.strip() for item in value.split(',')]
        else:
            metadata[key] = value
    
    return metadata

def convert_markdown_to_html(markdown_content):
    """Convert markdown content to HTML"""
    if MARKDOWN_AVAILABLE:
        # Use Python Markdown library if available
        return markdown.markdown(markdown_content, extensions=['tables', 'fenced_code'])
    else:
        # Simple regex-based conversion for basic markdown
        # This is a very minimal implementation
        # Headers
        html = re.sub(r'^# (.*?)$', r'<h1>\1</h1>', markdown_content, flags=re.MULTILINE)
        html = re.sub(r'^## (.*?)$', r'<h2>\1</h2>', html, flags=re.MULTILINE)
        html = re.sub(r'^### (.*?)$', r'<h3>\1</h3>', html, flags=re.MULTILINE)
        
        # Bold and italic
        html = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', html)
        html = re.sub(r'\*(.*?)\*', r'<em>\1</em>', html)
        
        # Links
        html = re.sub(r'\[(.*?)\]\((.*?)\)', r'<a href="\2">\1</a>', html)
        
        # Lists (very basic)
        html = re.sub(r'^\- (.*?)$', r'<li>\1</li>', html, flags=re.MULTILINE)
        
        # Paragraphs (very simple)
        paragraphs = html.split('\n\n')
        for i, p in enumerate(paragraphs):
            if not p.strip().startswith('<'):
                paragraphs[i] = f'<p>{p}</p>'
        
        html = '\n\n'.join(paragraphs)
        
        return html

def format_date(date_str, language):
    """Format a date string according to the language"""
    try:
        date_obj = datetime.datetime.fromisoformat(date_str)
        if language == 'zh-tw':
            # Format date for Chinese (Taiwan)
            return f"{date_obj.year}年{date_obj.month}月{date_obj.day}日"
        else:
            # Format date for English
            return date_obj.strftime("%B %d, %Y")
    except ValueError:
        return date_str

def read_template(template_path):
    """Read the HTML template file"""
    try:
        with open(template_path, 'r', encoding='utf-8') as file:
            return file.read()
    except Exception as e:
        print(f"Error reading template file: {e}")
        sys.exit(1)

def generate_html(template, metadata, html_content, language, slug):
    """Generate HTML file from template, metadata and HTML content"""
    # Format date according to language
    formatted_date = format_date(metadata.get('date', ''), language)
    
    # Replace placeholders in the template
    html = template
    
    # Replace meta tags
    html = html.replace('<title>Tammy Yang | Blog Post</title>', 
                        f'<title>{metadata["title"]} | Tammy Yang Blog</title>')
    
    # Update Open Graph / Facebook Meta Tags
    html = re.sub(r'<meta property="og:title" content="[^"]*">', 
                  f'<meta property="og:title" content="{metadata["title"]} | Tammy Yang Blog">', html)
    html = re.sub(r'<meta property="og:description" content="[^"]*">', 
                  f'<meta property="og:description" content="{metadata["summary"]}">', html)
    
    if metadata.get('image'):
        html = re.sub(r'<meta property="og:image" content="[^"]*">', 
                      f'<meta property="og:image" content="{metadata["image"]}">', html)
    
    # Update Twitter Meta Tags
    html = re.sub(r'<meta name="twitter:title" content="[^"]*">', 
                  f'<meta name="twitter:title" content="{metadata["title"]} | Tammy Yang Blog">', html)
    html = re.sub(r'<meta name="twitter:description" content="[^"]*">', 
                  f'<meta name="twitter:description" content="{metadata["summary"]}">', html)
    
    if metadata.get('image'):
        html = re.sub(r'<meta name="twitter:image" content="[^"]*">', 
                      f'<meta name="twitter:image" content="{metadata["image"]}">', html)
    
    # Prepare the post header content
    post_header = f'''
        <h1 class="post-title">{metadata["title"]}</h1>
        <div class="post-meta">
            <div class="post-date">
                <i class="far fa-calendar-alt"></i>
                {formatted_date}
            </div>
            <div class="post-author">
                <i class="far fa-user"></i>
                {metadata.get("author", "Tammy Yang")}
            </div>
        </div>
        <div class="language-toggle">
            <button class="lang-btn {'active' if language == 'en' else ''}" data-lang="en" 
                onclick="window.location.href='{slug}_en.html'">English</button>
            <button class="lang-btn {'active' if language == 'zh-tw' else ''}" data-lang="zh-tw"
                onclick="window.location.href='{slug}_zh-tw.html'">中文</button>
        </div>
    '''
    
    # Replace post header placeholder
    post_header_pattern = r'<div id="postHeader" class="post-header">\s*<!-- Post title and meta info will be dynamically inserted here -->\s*</div>'
    html = re.sub(post_header_pattern, f'<div id="postHeader" class="post-header">{post_header}</div>', html)
    
    # Set featured image if available
    if metadata.get('image'):
        featured_img = f'<img src="{metadata["image"]}" alt="{metadata["title"]}" class="post-featured-img">'
        featured_img_pattern = r'<div id="featuredImageContainer">\s*<!-- Featured image will be dynamically inserted here -->\s*</div>'
        html = re.sub(featured_img_pattern, f'<div id="featuredImageContainer">{featured_img}</div>', html)
    
    # Replace post content
    post_content_pattern = r'<div id="postContent" class="post-content">\s*<!-- Post content will be dynamically inserted here -->\s*</div>'
    html = re.sub(post_content_pattern, f'<div id="postContent" class="post-content">{html_content}</div>', html)
    
    # Remove the script tag that loads the dynamic JS (not needed in static HTML)
    html = re.sub(r'<script src="assets/js/blog-post.js"></script>', '', html)
    
    # Add static share functions since we removed the JavaScript
    share_script = '''
    <script>
    function shareOnTwitter() {
        const title = encodeURIComponent(document.title);
        const url = encodeURIComponent(window.location.href);
        window.open(`https://twitter.com/intent/tweet?text=${title}&url=${url}`, '_blank');
    }
    
    function shareOnLinkedIn() {
        const url = encodeURIComponent(window.location.href);
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
    }
    </script>
    '''
    html = html.replace('</body>', f'{share_script}</body>')
    
    return html

def create_output_directory(output_path):
    """Create output directory if it doesn't exist"""
    os.makedirs(output_path, exist_ok=True)

def convert_post(slug, language=None):
    """Convert a single blog post to HTML"""
    languages_to_process = [language] if language else CONFIG['languages']
    
    template = read_template(CONFIG['template_path'])
    create_output_directory(CONFIG['output_path'])
    
    converted = False
    
    for lang in languages_to_process:
        markdown_file = os.path.join(CONFIG['blog_path'], lang, f"{slug}.md")
        
        if not os.path.exists(markdown_file):
            print(f"Warning: File not found: {markdown_file}")
            continue
        
        try:
            with open(markdown_file, 'r', encoding='utf-8') as file:
                markdown_content = file.read()
            
            metadata, content = parse_front_matter(markdown_content, markdown_file)
            html_content = convert_markdown_to_html(content)
            
            metadata['language'] = lang
            metadata['slug'] = slug
            
            html = generate_html(template, metadata, html_content, lang, slug)
            
            output_file = os.path.join(CONFIG['output_path'], f"{slug}_{lang}.html")
            with open(output_file, 'w', encoding='utf-8') as file:
                file.write(html)
            
            print(f"✓ Successfully converted {markdown_file} to {output_file}")
            converted = True
            
        except Exception as e:
            print(f"Error converting {markdown_file}: {e}")
    
    return converted

def convert_all_posts():
    """Convert all blog posts in all languages"""
    for lang in CONFIG['languages']:
        lang_dir = os.path.join(CONFIG['blog_path'], lang)
        
        if not os.path.exists(lang_dir):
            print(f"Warning: Language directory not found: {lang_dir}")
            continue
        
        for file in os.listdir(lang_dir):
            if file.endswith('.md'):
                slug = file[:-3]  # Remove .md extension
                convert_post(slug, lang)

def copy_assets():
    """Copy necessary assets to the output directory"""
    # Create assets directory in output
    os.makedirs(os.path.join(CONFIG['output_path'], 'assets'), exist_ok=True)
    os.makedirs(os.path.join(CONFIG['output_path'], 'assets', 'blog-images'), exist_ok=True)
    
    # Copy blog images
    src_img_dir = os.path.join('assets', 'blog-images')
    dst_img_dir = os.path.join(CONFIG['output_path'], 'assets', 'blog-images')
    
    if os.path.exists(src_img_dir):
        for file in os.listdir(src_img_dir):
            src_file = os.path.join(src_img_dir, file)
            dst_file = os.path.join(dst_img_dir, file)
            if os.path.isfile(src_file):
                shutil.copy2(src_file, dst_file)
                print(f"✓ Copied asset: {file}")

def main():
    """Main function to parse arguments and execute conversion"""
    parser = argparse.ArgumentParser(description='Convert Markdown blog posts to static HTML')
    parser.add_argument('--all', action='store_true', help='Convert all blog posts')
    parser.add_argument('--post', help='Convert a specific blog post by slug')
    parser.add_argument('--language', choices=['en', 'zh-tw'], help='Convert for a specific language')
    
    args = parser.parse_args()
    
    if not YAML_AVAILABLE:
        print("Warning: PyYAML not found. Using simple YAML parser.")
        print("For better parsing, install PyYAML: pip install pyyaml")
    
    if not MARKDOWN_AVAILABLE:
        print("Warning: Python-Markdown not found. Using simple markdown parser.")
        print("For better markdown support, install Python-Markdown: pip install markdown")
    
    # Copy necessary assets
    copy_assets()
    
    if args.all:
        convert_all_posts()
    elif args.post:
        success = convert_post(args.post, args.language)
        if not success:
            sys.exit(1)
    else:
        parser.print_help()
        sys.exit(1)
    
    print("\nConversion completed!")

if __name__ == "__main__":
    main()