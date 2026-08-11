#!/usr/bin/env python3
"""
Medium Article Uploader - Interactive Mode
Opens browsers and waits for manual interaction for login and upload
"""

import json
from pathlib import Path

# 產出落在本 repo 內的 output/，跟著腳本走，不依賴執行時的 cwd
OUTPUT_DIR = Path(__file__).resolve().parent.parent / 'output'
DATA_FILE = OUTPUT_DIR / 'medium_articles_data.json'
MD_DIR = OUTPUT_DIR / 'medium_upload_markdown'


def check_article_data():
    """Verify all article data and images are present"""
    data_path = DATA_FILE
    
    with open(data_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    articles = data.get('articles', [])
    
    print("\n" + "="*70)
    print("MEDIUM ARTICLE UPLOAD - DATA VERIFICATION")
    print("="*70)
    
    for i, article in enumerate(articles, 1):
        print(f"\n[Article {i}] {article['title']}")
        print(f"  Slug: {article['slug']}")
        print(f"  Summary: {article['summary'][:80]}...")
        print(f"  Tags: {', '.join(article['tags'])}")
        
        # Check content length
        content = article['content']
        print(f"  Content: {len(content)} characters")
        
        # Check images
        if article.get('images'):
            print(f"  Images ({len(article['images'])}):")
            for img in article['images']:
                img_path = Path(img['path'])
                exists = "✓" if img_path.exists() else "✗"
                print(f"    {exists} {img['name']} ({img['size_mb']}MB) - {img_path}")
        else:
            print(f"  Images: None")
        
        # Check markdown file
        md_file = MD_DIR / f'article_{i}_{article["slug"]}.md'
        md_exists = "✓" if md_file.exists() else "✗"
        print(f"  Markdown file: {md_exists} {md_file}")
    
    print("\n" + "="*70)
    print("UPLOAD INSTRUCTIONS")
    print("="*70)
    print("""
To upload articles to Medium as drafts:

1. Go to https://medium.com and log in with your account

2. For each article:
   a. Click "Write" or "New Story" button
   b. Enter the title
   c. Paste the article content (see below for content)
   d. Add images from /Users/abbyting/abby-log/public/images/
   e. Add tags/topics
   f. Click the menu (three dots) and select "Save draft" (NOT "Publish")
   g. Copy the draft URL

3. After each upload, the draft URL will appear in your browser

ARTICLE CONTENTS AND IMAGES:
""")
    
    for i, article in enumerate(articles, 1):
        print(f"\n{'='*70}")
        print(f"ARTICLE {i}: {article['title']}")
        print(f"{'='*70}")
        print(f"\nSlug: {article['slug']}")
        print(f"\nSummary:\n{article['summary']}")
        print(f"\nTags: {', '.join(article['tags'])}")
        print(f"\nContent preview (first 500 chars):\n{article['content'][:500]}...")
        
        if article.get('images'):
            print(f"\nImages to upload:")
            for img in article['images']:
                print(f"  - {img['name']} ({img['size_mb']}MB)")
                print(f"    Path: {img['path']}")

if __name__ == '__main__':
    check_article_data()
    
    print("\n" + "="*70)
    print("\nOnce you have manually uploaded all 3 articles to Medium drafts,")
    print("please collect the draft URLs and report back.")
    print("\nDraft URL pattern: https://medium.com/@yourname/[draft-id]")
    print("="*70)
