#!/usr/bin/env python3
"""
Medium Upload Helper - Provides formatted content ready for manual upload
Prepares all markdown, images, and metadata for three articles
"""

import json
import re
from pathlib import Path


# 產出落在本 repo 內的 output/，跟著腳本走，不依賴執行時的 cwd
OUTPUT_DIR = Path(__file__).resolve().parent.parent / 'output'
DATA_FILE = OUTPUT_DIR / 'medium_articles_data.json'
MD_DIR = OUTPUT_DIR / 'medium_upload_markdown'


ARTICLES = [
    {
        "file": "/Users/abbyting/abby-log/src/content/blog/ai-memory-bottleneck.mdx",
        "slug": "ai-memory-dashboard",
        "frontmatter": {
            "title": "AI 記憶系統的死胡同——為什麼記憶的瓶頸不在記憶",
            "summary": "我以為問題在於 AI 記不住，但自動化讓我才發現真相：瓶頸根本不在記憶，而在那道從機器到人腦的最後一哩。",
            "tags": ["ai-workflow", "tools", "design", "reflection"]
        }
    },
    {
        "file": "/Users/abbyting/abby-log/src/content/blog/gypsy-and-hitchlin.mdx",
        "slug": "gypsy-and-hitchlin",
        "frontmatter": {
            "title": "我用吉普賽和哈奇林實現 AI 記憶自動化——多代理協作的故事",
            "summary": "從單一助理到多代理系統：怎麼讓 Hermes 和 Claude Code 分工合作，自動迭代和管理記憶。",
            "tags": ["ai-workflow", "hermes", "agents", "automation"]
        }
    },
    {
        "file": "/Users/abbyting/abby-log/src/content/blog/prompt-tutor.mdx",
        "slug": "prompt-tutor",
        "frontmatter": {
            "title": "實驗如何用 AI 破解專業領域知識的迷宮",
            "summary": "最近我接手了一個新領域的專案，剛開始參與客戶會議時很挫折。客戶太習慣自己的工作流程，會很自然地拋出各種術語。每次他們試著解釋，我還是聽得一頭霧水。",
            "tags": ["ai-workflow", "design-thinking", "case-study", "claude"]
        }
    }
]


def extract_content(mdx_path):
    """Extract markdown content from MDX file"""
    with open(mdx_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove YAML frontmatter
    match = re.match(r'^---\n(.*?)\n---\n(.*)$', content, re.DOTALL)
    if match:
        return match.group(2).strip()
    return content


def get_images(slug):
    """Get image files for article"""
    image_dir = Path(f'/Users/abbyting/abby-log/public/images/{slug}')
    if not image_dir.exists():
        return []
    
    images = []
    for img_file in sorted(image_dir.glob('*')):
        if img_file.suffix.lower() in ['.png', '.jpg', '.jpeg', '.gif', '.webp']:
            images.append({
                'name': img_file.name,
                'path': str(img_file),
                'size_mb': round(img_file.stat().st_size / (1024*1024), 2)
            })
    
    return images


def create_upload_guide():
    """Create comprehensive upload guide"""
    
    print("\n" + "="*80)
    print(" "*20 + "MEDIUM DRAFT UPLOAD GUIDE")
    print("="*80 + "\n")
    
    # Process each article
    upload_data = {
        'timestamp': __import__('datetime').datetime.now().isoformat(),
        'articles': []
    }
    
    for idx, article in enumerate(ARTICLES, 1):
        print(f"\n{'#'*80}")
        print(f"# ARTICLE {idx}: {article['frontmatter']['title']}")
        print(f"{'#'*80}\n")
        
        # Read content
        content = extract_content(article['file'])
        images = get_images(article['slug'])
        
        article_info = {
            'index': idx,
            'title': article['frontmatter']['title'],
            'summary': article['frontmatter']['summary'],
            'tags': article['frontmatter']['tags'],
            'slug': article['slug'],
            'images': images,
            'content': content,
            'content_length': len(content)
        }
        
        upload_data['articles'].append(article_info)
        
        # Print metadata
        print("METADATA:")
        print(f"  Title: {article['frontmatter']['title']}")
        print(f"  Summary: {article['frontmatter']['summary']}")
        print(f"  Tags: {', '.join(article['frontmatter']['tags'])}")
        print(f"  Content Length: {len(content):,} characters")
        
        # Print images
        print(f"\n  IMAGES ({len(images)} total):")
        if images:
            for img in images:
                print(f"    - {img['name']} ({img['size_mb']} MB)")
                print(f"      Path: {img['path']}")
        else:
            print("    (No images)")
        
        # Print upload instructions
        print(f"\nUPLOAD STEPS:")
        print(f"  1. Go to https://medium.com/new-story")
        print(f"  2. Fill Title: {article['frontmatter']['title']}")
        print(f"  3. Fill Summary: {article['frontmatter']['summary']}")
        print(f"  4. Add Tags: {', '.join(article['frontmatter']['tags'])}")
        print(f"  5. Copy & paste markdown content below")
        if images:
            print(f"  6. Upload {len(images)} images")
            print(f"  7. IMPORTANT: Save as DRAFT (NOT published)")
            print(f"  8. Copy the draft URL when saved")
        else:
            print(f"  6. IMPORTANT: Save as DRAFT (NOT published)")
            print(f"  7. Copy the draft URL when saved")
        
        # Print content preview
        print(f"\nMARKDOWN CONTENT (first 1000 chars):")
        print("-" * 80)
        preview = content[:1000] + "..." if len(content) > 1000 else content
        print(preview)
        print("-" * 80)
        
        print(f"\n[Full content is {len(content):,} chars - ready to copy]")
    
    # Save upload data
    data_file = DATA_FILE
    data_file.parent.mkdir(parents=True, exist_ok=True)
    with open(data_file, 'w', encoding='utf-8') as f:
        json.dump(upload_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n✓ Saved article data to: {data_file}")
    
    # Create markdown files for easy copying
    md_dir = MD_DIR
    md_dir.mkdir(parents=True, exist_ok=True)
    
    for article_info in upload_data['articles']:
        md_file = md_dir / f"article_{article_info['index']}_{article_info['slug']}.md"
        
        # Create file with metadata + content
        full_content = f"""# {article_info['title']}

**Summary:** {article_info['summary']}

**Tags:** {', '.join(article_info['tags'])}

**Images:** {len(article_info['images'])} files
{chr(10).join(f"- {img['name']}" for img in article_info['images'])}

---

## CONTENT

{article_info['content']}
"""
        
        with open(md_file, 'w', encoding='utf-8') as f:
            f.write(full_content)
        
        print(f"✓ Created: {md_file}")
    
    return upload_data


def print_summary(upload_data):
    """Print final summary"""
    print("\n" + "="*80)
    print(" "*25 + "UPLOAD SUMMARY")
    print("="*80 + "\n")
    
    for article in upload_data['articles']:
        print(f"{article['index']}. {article['title']}")
        print(f"   Content: {article['content_length']:,} characters")
        print(f"   Images: {len(article['images'])} files")
        print(f"   Tags: {', '.join(article['tags'])}")
        print(f"   Markdown file: {MD_DIR}/article_{article['index']}_{article['slug']}.md")
        print()
    
    print("="*80)
    print("\nNEXT STEPS:")
    print("1. Open each markdown file in the editor")
    print("2. Go to https://medium.com/new-story")
    print("3. Copy title, summary, content, and tags from the markdown files")
    print("4. Upload images from the image directories listed")
    print("5. Save each article as DRAFT")
    print("6. Record the draft URLs")
    print("\nAll files have been prepared in:")
    print(f"  - {MD_DIR}/")
    print(f"  - {DATA_FILE}")
    print("="*80 + "\n")


if __name__ == '__main__':
    upload_data = create_upload_guide()
    print_summary(upload_data)
