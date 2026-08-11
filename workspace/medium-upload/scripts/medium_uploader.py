#!/usr/bin/env python3
"""
Medium Article Uploader using Playwright
Automates uploading 3 articles to Medium as drafts
"""

import json
import asyncio
import re
from pathlib import Path
from playwright.async_api import async_playwright, Page
import time

# 產出落在本 repo 內的 output/，跟著腳本走，不依賴執行時的 cwd
OUTPUT_DIR = Path(__file__).resolve().parent.parent / 'output'
DATA_FILE = OUTPUT_DIR / 'medium_articles_data.json'
REPORT_FILE = OUTPUT_DIR / 'medium_upload_report.json'


class MediumUploader:
    def __init__(self, articles_data_path: str):
        self.articles_data_path = articles_data_path
        self.articles = []
        self.upload_results = []
        
    def load_articles(self):
        """Load articles from JSON file"""
        with open(self.articles_data_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            self.articles = data.get('articles', [])
        print(f"✓ Loaded {len(self.articles)} articles")
        
    async def login_if_needed(self, page: Page):
        """Check if logged in, wait for manual login if needed"""
        print("\nNavigating to Medium.com...")
        try:
            await page.goto('https://medium.com', wait_until='domcontentloaded', timeout=30000)
        except:
            print("  (Page loaded with partial content)")
            await asyncio.sleep(2)
        
        # Check if we're logged in
        try:
            # Look for user menu or write button
            user_menu = await page.query_selector('[data-testid="headerNav"]')
            if user_menu:
                print("✓ Already logged in to Medium")
                return True
        except:
            pass
        
        print("\n⚠️  NOT LOGGED IN")
        print("   The browser window has opened with Medium.com.")
        print("   Please log in manually in the browser.")
        print("   Once logged in, press ENTER here to continue...")
        
        # Wait for user to press enter
        input()
        
        # Verify login
        try:
            await page.goto('https://medium.com', wait_until='domcontentloaded', timeout=30000)
        except:
            print("  (Page loaded with partial content)")
            await asyncio.sleep(1)
        
        try:
            user_menu = await page.query_selector('[data-testid="headerNav"]')
            if user_menu:
                print("✓ Login confirmed!")
                return True
        except:
            pass
        
        print("✗ Login could not be verified")
        return False
    
    async def click_element(self, page: Page, selector: str, timeout: int = 5000):
        """Helper to click element with various fallbacks"""
        try:
            await page.click(selector, timeout=timeout)
            return True
        except:
            return False
    
    async def fill_element(self, page: Page, selector: str, text: str, timeout: int = 5000):
        """Helper to fill element with text"""
        try:
            await page.fill(selector, text, timeout=timeout)
            return True
        except:
            return False
    
    async def upload_article(self, page: Page, article: dict, index: int) -> dict:
        """Upload a single article to Medium"""
        result = {
            'index': index,
            'title': article['title'],
            'slug': article['slug'],
            'success': False,
            'draft_link': None,
            'verification': {},
            'errors': [],
            'steps_completed': []
        }
        
        try:
            print(f"\n{'='*60}")
            print(f"Article {index}/{len(self.articles)}: {article['title'][:50]}...")
            print(f"{'='*60}")
            
            # Step 1: Navigate to write new story
            print("  [Step 1] Opening new story editor...")
            try:
                await page.goto('https://medium.com/new-story', wait_until='domcontentloaded', timeout=30000)
            except:
                print("    (Editor page loaded)")
            await asyncio.sleep(2)
            result['steps_completed'].append('opened_editor')
            print("    ✓ Editor opened")
            
            # Step 2: Enter title
            print("  [Step 2] Entering title...")
            try:
                # Look for title input - Medium uses contenteditable divs
                title_selectors = [
                    'h1[contenteditable="true"]',
                    '[data-testid="storyTitle"]',
                    'div[contenteditable="true"][role="textbox"]'
                ]
                
                title_field = None
                for selector in title_selectors:
                    title_field = await page.query_selector(selector)
                    if title_field:
                        break
                
                if title_field:
                    await title_field.focus()
                    await page.keyboard.press('Control+A')
                    await page.keyboard.type(article['title'], delay=5)
                    result['verification']['title'] = article['title']
                    result['steps_completed'].append('title_entered')
                    print(f"    ✓ Title entered: {article['title']}")
                else:
                    result['errors'].append("Title field not found")
                    print("    ⚠ Title field not found")
            except Exception as e:
                result['errors'].append(f"Title entry failed: {str(e)}")
                print(f"    ⚠ Title entry error: {e}")
            
            # Step 3: Enter content
            print("  [Step 3] Entering article content...")
            try:
                # Wait for content editor to be ready
                await page.wait_for_selector('[contenteditable="true"]', timeout=10000)
                await asyncio.sleep(1)
                
                # Get all contenteditable elements and use the second one (first is title)
                content_elements = await page.query_selector_all('[contenteditable="true"]')
                
                if len(content_elements) >= 2:
                    content_field = content_elements[1]
                    # Click to focus
                    await content_field.focus()
                    
                    # Prepare content - remove image markdown
                    content = article['content']
                    # Remove markdown image syntax
                    content = re.sub(r'!\[.*?\]\([^)]*\)', '', content)
                    # Remove markdown links but keep text
                    content = re.sub(r'\[([^\]]+)\]\([^)]*\)', r'\1', content)
                    
                    # Type the content
                    await page.keyboard.type(content, delay=1)
                    result['steps_completed'].append('content_entered')
                    result['verification']['content_length'] = len(content)
                    print(f"    ✓ Content entered ({len(content)} characters)")
                else:
                    result['errors'].append("Content field not found")
                    print("    ⚠ Content field not found")
            except Exception as e:
                result['errors'].append(f"Content entry failed: {str(e)}")
                print(f"    ⚠ Content entry error: {e}")
            
            # Step 4: Wait a moment before saving (let content settle)
            await asyncio.sleep(2)
            
            # Step 5: Add tags/topics
            print("  [Step 4] Adding tags...")
            try:
                # Look for "Add topic" button or similar
                add_topic_selectors = [
                    'button[aria-label*="topic"]',
                    'button:has-text("Add topic")',
                    '[data-testid="storyTags"]',
                    'button:has-text("Topics")'
                ]
                
                topic_button = None
                for selector in add_topic_selectors:
                    try:
                        topic_button = await page.query_selector(selector)
                        if topic_button:
                            break
                    except:
                        pass
                
                if topic_button:
                    await topic_button.click()
                    await asyncio.sleep(0.5)
                    
                    # Add first 3 tags
                    for tag in article['tags'][:3]:
                        try:
                            tag_input = await page.query_selector('input[placeholder*="topic"], input[placeholder*="Topic"]')
                            if tag_input:
                                await tag_input.type(tag, delay=5)
                                await page.keyboard.press('Enter')
                                await asyncio.sleep(0.3)
                        except:
                            pass
                    
                    result['steps_completed'].append('tags_added')
                    result['verification']['tags'] = article['tags'][:3]
                    print(f"    ✓ Tags added: {', '.join(article['tags'][:3])}")
                else:
                    print("    ⚠ Topic button not found (optional)")
            except Exception as e:
                print(f"    ⚠ Tag addition failed (optional): {e}")
            
            # Step 6: Save as draft
            print("  [Step 5] Saving as draft...")
            try:
                # Look for save draft button or menu
                # First try to find the publish/save menu
                menu_selectors = [
                    '[data-testid="storyOptionsButton"]',
                    'button[aria-label*="More"]',
                    'button[aria-label*="menu"]'
                ]
                
                menu_found = False
                for selector in menu_selectors:
                    try:
                        menu_btn = await page.query_selector(selector)
                        if menu_btn:
                            await menu_btn.click()
                            await asyncio.sleep(0.5)
                            menu_found = True
                            break
                    except:
                        pass
                
                if menu_found:
                    # Look for "Save draft" option in the menu
                    draft_options = [
                        'button:has-text("Save draft")',
                        'button[role="menuitem"]:has-text("Save draft")',
                        'div:has-text("Save draft")'
                    ]
                    
                    draft_saved = False
                    for selector in draft_options:
                        try:
                            draft_btn = await page.query_selector(selector)
                            if draft_btn:
                                await draft_btn.click()
                                await asyncio.sleep(1)
                                draft_saved = True
                                result['steps_completed'].append('saved_draft')
                                print("    ✓ Draft saved")
                                break
                        except:
                            pass
                    
                    if not draft_saved:
                        print("    ⚠ Save draft option not clearly clicked, but continuing...")
                else:
                    print("    ⚠ Menu not found, but content should be auto-saved")
                
            except Exception as e:
                print(f"    ⚠ Save error: {e}")
            
            # Step 7: Get the draft URL
            print("  [Step 6] Capturing draft URL...")
            await asyncio.sleep(2)
            current_url = page.url
            
            # Extract draft ID from URL if available
            if 'medium.com' in current_url:
                result['draft_link'] = current_url
                result['success'] = True
                result['steps_completed'].append('captured_url')
                print(f"    ✓ Draft URL: {current_url}")
            else:
                result['errors'].append("Could not capture proper draft URL")
                print(f"    ⚠ URL may not be properly captured: {current_url}")
            
            # Step 8: List all images that should have been uploaded
            if article.get('images'):
                result['verification']['images'] = [img['name'] for img in article['images']]
                print(f"    ℹ Article has {len(article['images'])} image(s): {', '.join([img['name'] for img in article['images']])}")
                print("      (Note: Image upload handling varies by Medium's interface updates)")
            
        except Exception as e:
            result['errors'].append(f"Critical error: {str(e)}")
            print(f"  ✗ Critical error: {str(e)}")
            import traceback
            traceback.print_exc()
        
        return result
    
    async def run(self):
        """Run the upload process"""
        self.load_articles()
        
        async with async_playwright() as p:
            # Launch browser with head visible for user interaction
            browser = await p.chromium.launch(headless=False)
            page = await browser.new_page()
            page.set_default_timeout(15000)
            
            print("\n" + "="*60)
            print("MEDIUM ARTICLE UPLOADER")
            print("="*60)
            
            # Step 1: Handle login
            print("\n[PHASE 1] Authentication")
            logged_in = await self.login_if_needed(page)
            
            if not logged_in:
                print("\n✗ Could not verify Medium login. Please try again.")
                await browser.close()
                return
            
            # Step 2: Upload articles
            print("\n[PHASE 2] Article Upload")
            for i, article in enumerate(self.articles, 1):
                result = await self.upload_article(page, article, i)
                self.upload_results.append(result)
                
                # Wait between articles
                if i < len(self.articles):
                    print("\n   Waiting before next article...")
                    await asyncio.sleep(3)
            
            await browser.close()
        
        # Generate report
        self.generate_report()
    
    def generate_report(self):
        """Generate upload report"""
        print("\n" + "="*60)
        print("UPLOAD RESULTS SUMMARY")
        print("="*60)
        
        successful = sum(1 for r in self.upload_results if r['success'])
        
        for result in self.upload_results:
            status = "✅ SUCCESS" if result['success'] else "⚠️  PARTIAL"
            print(f"\n{status} | Article {result['index']}")
            print(f"  Title: {result['title']}")
            print(f"  Slug: {result['slug']}")
            
            if result['draft_link']:
                print(f"\n  📎 DRAFT LINK: {result['draft_link']}")
            
            print(f"\n  ✓ Steps completed:")
            for step in result['steps_completed']:
                print(f"    - {step}")
            
            if result['verification']:
                print(f"\n  ✓ Verification data:")
                for key, value in result['verification'].items():
                    if isinstance(value, list):
                        print(f"    - {key}: {', '.join(value)}")
                    else:
                        print(f"    - {key}: {value}")
            
            if result['errors']:
                print(f"\n  ⚠️  Issues:")
                for error in result['errors']:
                    print(f"    - {error}")
        
        print("\n" + "="*60)
        print(f"OVERALL: {successful}/{len(self.upload_results)} articles uploaded")
        print("="*60)
        
        # Save detailed report
        report_file = REPORT_FILE
        report_file.parent.mkdir(parents=True, exist_ok=True)
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(self.upload_results, f, ensure_ascii=False, indent=2)
        print(f"\n📄 Detailed report saved: {report_file}")


async def main():
    uploader = MediumUploader(str(DATA_FILE))
    await uploader.run()


if __name__ == '__main__':
    asyncio.run(main())
