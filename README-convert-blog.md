# Blog Markdown to HTML Converter

This Python script converts Markdown blog posts to static HTML files, enabling them to be viewed directly on GitHub without relying on client-side JavaScript to render the content.

## Why This Script Exists

GitHub's Content Security Policy restricts the execution of inline JavaScript, which prevents dynamic markdown loading and rendering in browser. This means that blog posts written in Markdown and normally rendered by JavaScript won't display properly when viewed directly on GitHub.

This converter solves the problem by:
1. Pre-rendering the Markdown to HTML
2. Embedding the content directly into the HTML template
3. Creating standalone HTML files that don't require any JavaScript execution

## Features

- Converts Markdown blog posts with YAML front matter to static HTML files
- Extracts metadata from YAML front matter (title, date, author, tags, etc.)
- Uses the existing blog-post.html template structure
- Supports multiple languages (English and Chinese)
- Preserves language switching functionality
- Copies blog images and assets to the output directory
- Handles social media sharing functionality

## Requirements

The script has minimal dependencies and works with Python's standard library. However, for better Markdown and YAML parsing, you can optionally install:

```bash
pip install pyyaml markdown
```

## Usage

### Convert a specific blog post

```bash
python convert_blog.py --post 250415
```

### Convert a specific post in a specific language

```bash
python convert_blog.py --post 250415 --language en
```

### Convert all blog posts in all languages

```bash
python convert_blog.py --all
```

## Output Directory Structure

The script creates an `html_blogs` directory with the following structure:

```
html_blogs/
    250415_en.html
    250415_zh-tw.html
    assets/
        blog-images/
            250415.png
```

## Configuration

The script uses the following default configuration:

```python
CONFIG = {
    'blog_path': 'blogs',
    'output_path': 'html_blogs',
    'template_path': 'blog-post.html',
    'languages': ['en', 'zh-tw'],
    'default_lang': 'en'
}
```

You can modify these settings directly in the script if needed.

## How It Works

1. **Parses YAML front matter**: Extracts metadata like title, date, author, tags, etc.
2. **Converts Markdown to HTML**: Transforms Markdown content to HTML using Python-Markdown or a built-in regex-based parser
3. **Injects content into template**: Places the HTML content and metadata into the blog-post.html template
4. **Creates language-specific versions**: Generates separate HTML files for each supported language
5. **Copies assets**: Ensures images and other assets are available in the output directory

## Best Practices

To ensure your blog posts convert correctly:

1. Always include proper YAML front matter with title, date, and other metadata
2. Use standard Markdown syntax for best compatibility
3. Store blog images in the assets/blog-images directory
4. Include language identifiers in blog post filenames (e.g., post_en.md, post_zh-tw.md)

## License

This script is released under the same license as the main project.