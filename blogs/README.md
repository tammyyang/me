# Blog Creation Guide

This guide will help you create new blog posts for Tammy Yang's personal website. Blog posts are written in Markdown format and automatically converted to static HTML files using the `convert_blog.py` script.

## 📁 Directory Structure

```
blogs/
├── README.md          # This guide
├── en/               # English blog posts
│   └── YYMMDD.md     # Markdown content with YAML front matter
└── zh-tw/            # Traditional Chinese blog posts
    └── YYMMDD.md     # Markdown content with YAML front matter
```

## 🆕 Creating a New Blog Post

### Step 1: Choose a Date-based Slug
Use the format `YYMMDD` (e.g., `250525` for May 25, 2025) as your blog post identifier.

### Step 2: Create Language Versions
Create both English and Traditional Chinese versions in their respective folders:
- `blogs/en/YYMMDD.md`
- `blogs/zh-tw/YYMMDD.md`

### Step 3: Add Required Front Matter
Each Markdown file must start with YAML front matter containing:

```yaml
---
title: Your Blog Post Title
date: YYYY-MM-DD
author: Tammy Yang
tags: [Tag1, Tag2, Tag3]
image: assets/blog-images/YYMMDD.png
summary: A brief summary of your blog post
language: en  # or zh-tw
---
```

### Step 4: Write Content
After the front matter, write your blog content in Markdown format.

## 📝 Example Blog Post

Here's an example of how to structure a new blog post:

**File: `blogs/en/250525.md`**
```markdown
---
title: My New Blog Post
date: 2025-05-25
author: Tammy Yang
tags: [Technology, AI, Innovation]
image: assets/blog-images/250525.png
summary: This is an example blog post showing the structure and format.
language: en
---

# My New Blog Post

This is the main content of your blog post. You can use all standard Markdown features:

## Subheadings

- Bullet points
- **Bold text**
- *Italic text*
- [Links](https://example.com)

### Code Examples

```python
def hello_world():
    print("Hello, World!")
```

## Conclusion

Wrap up your thoughts here.
```

**File: `blogs/zh-tw/250525.md`**
```markdown
---
title: 我的新部落格文章
date: 2025-05-25
author: Tammy Yang
tags: [科技, AI, 創新]
image: assets/blog-images/250525.png
summary: 這是一個展示結構和格式的範例部落格文章。
language: zh-tw
---

# 我的新部落格文章

這是您部落格文章的主要內容。您可以使用所有標準的 Markdown 功能：

## 副標題

- 項目符號
- **粗體文字**
- *斜體文字*
- [連結](https://example.com)

## 結論

在這裡總結您的想法。
```

## 🖼️ Adding Images

### Blog Featured Image
1. Create a PNG image for your blog post (recommended size: 1200x630px for social media sharing)
2. Save it as `assets/blog-images/YYMMDD.png`
3. Reference it in the front matter: `image: assets/blog-images/YYMMDD.png`

### Inline Images
For images within your blog content:
1. Save images in `assets/blog-images/`
2. Reference them using relative paths: `![Alt text](../assets/blog-images/image-name.png)`

## 🏷️ Front Matter Fields

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| `title` | ✅ | Blog post title | `"Design Thinking and AI"` |
| `date` | ✅ | Publication date | `2025-04-15` |
| `author` | ✅ | Author name | `"Tammy Yang"` |
| `tags` | ✅ | Array of tags | `[AI, Startup, Management]` |
| `image` | ✅ | Featured image path | `assets/blog-images/250415.png` |
| `summary` | ✅ | Brief description | `"Break through AI conversations with design thinking"` |
| `language` | ✅ | Language code | `en` or `zh-tw` |

## 🔄 Converting to HTML

After creating your blog posts, convert them to HTML using the conversion script:

### Convert a specific post:
```powershell
python convert_blog.py --post 250525
```

### Convert all posts:
```powershell
python convert_blog.py --all
```

### Convert for a specific language:
```powershell
python convert_blog.py --post 250525 --language en
```

The generated HTML files will be saved in the `html_blogs/` directory.

## ✅ Checklist for New Blog Posts

Before publishing, ensure you have:

- [ ] Created both English and Traditional Chinese versions
- [ ] Added all required front matter fields
- [ ] Used the correct date format (YYYY-MM-DD)
- [ ] Added appropriate tags
- [ ] Created and referenced the featured image
- [ ] Proofread the content
- [ ] Run the conversion script to generate HTML
- [ ] Verified the generated HTML files look correct

## 🎨 Writing Tips

### English Posts
- Use clear, concise language
- Follow standard English grammar and punctuation
- Use active voice when possible
- Include relevant examples and case studies

### Traditional Chinese Posts
- Use Traditional Chinese characters (not Simplified)
- Maintain consistency in technical terms
- Consider cultural context for examples
- Ensure the tone matches the English version while being culturally appropriate

## 🚀 Advanced Features

### Custom Styling
The blog template supports custom CSS classes. You can add special formatting using HTML within your Markdown:

```html
<div class="highlight-box">
This content will be highlighted
</div>
```

### Code Syntax Highlighting
Use fenced code blocks with language specification for syntax highlighting:

````markdown
```python
def example_function():
    return "Hello, World!"
```
````

### Tables
Create tables using Markdown syntax:

```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
```

## 🐛 Troubleshooting

### Common Issues

1. **Missing front matter**: Ensure all required fields are present
2. **Invalid date format**: Use YYYY-MM-DD format
3. **Missing images**: Check that image paths are correct and files exist
4. **YAML syntax errors**: Validate your front matter YAML syntax
5. **Conversion errors**: Check that Python dependencies are installed

### Dependencies
Ensure you have the required Python packages:
```powershell
pip install pyyaml markdown
```

## 📚 Resources

- [Markdown Guide](https://www.markdownguide.org/)
- [YAML Syntax](https://yaml.org/spec/1.2/spec.html)
- [Blog Conversion Script](../convert_blog.py)
- [Blog Template](../blog-post.html)

---

*Happy blogging! 🎉*
