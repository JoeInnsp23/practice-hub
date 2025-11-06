#!/usr/bin/env python3
"""
Test script to verify announcements page fixes:
1. Check that the page loads without 500 errors
2. Verify we can create new announcements
"""

from playwright.sync_api import sync_playwright
import time

def test_announcements():
    with sync_playwright() as p:
        # Launch browser in headless mode
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()

        # Enable console logging to capture errors
        page = context.new_page()

        # Collect console messages and network errors
        console_messages = []
        network_errors = []

        page.on("console", lambda msg: console_messages.append(msg))
        page.on("response", lambda response:
            network_errors.append(f"{response.status} {response.url}")
            if response.status >= 500 else None)

        try:
            print("🚀 Starting announcements page test...")

            # Navigate to login page
            print("📝 Navigating to login page...")
            page.goto('http://localhost:3000/sign-in')
            page.wait_for_load_state('networkidle')

            # Login as admin
            print("🔑 Logging in as admin...")
            page.fill('input[name="email"]', 'joe@pageivy.com')
            page.fill('input[name="password"]', 'Innspired@321')
            page.click('button[type="submit"]')

            # Wait for navigation to complete
            page.wait_for_load_state('networkidle')
            time.sleep(2)  # Extra wait for auth to settle

            # Navigate to announcements page
            print("📢 Navigating to announcements page...")
            page.goto('http://localhost:3000/admin-hub/announcements')
            page.wait_for_load_state('networkidle')

            # Check for 500 errors in network
            errors_500 = [err for err in network_errors if "500" in err]
            if errors_500:
                print("❌ Found 500 errors:")
                for error in errors_500:
                    print(f"   - {error}")
            else:
                print("✅ Page loaded without 500 errors!")

            # Take a screenshot for verification
            page.screenshot(path='/tmp/announcements-page.png')
            print("📸 Screenshot saved to /tmp/announcements-page.png")

            # Test creating a new announcement
            print("\n🆕 Testing announcement creation...")

            # Click the New Announcement button
            new_button = page.get_by_role('button', name='New Announcement')
            if new_button.is_visible():
                new_button.click()
                page.wait_for_timeout(1000)  # Wait for dialog

                # Fill in the form
                print("   📝 Filling announcement form...")
                page.fill('input[name="title"]', 'Test Announcement - Fixed')

                # Fill content in textarea
                content_field = page.locator('textarea[name="content"]')
                content_field.fill('This is a test announcement to verify the 500 errors have been fixed.')

                # Select priority (info by default should work)
                priority_select = page.locator('select[name="priority"]')
                if priority_select.is_visible():
                    priority_select.select_option('info')

                # Submit the form
                print("   💾 Saving announcement...")
                save_button = page.get_by_role('button', name='Save')
                save_button.click()

                # Wait for response
                page.wait_for_timeout(2000)

                # Check for new 500 errors after save
                new_errors = [err for err in network_errors if "500" in err and "announcements.create" in err]
                if new_errors:
                    print("   ❌ Create failed with 500 error:")
                    for error in new_errors:
                        print(f"      - {error}")
                else:
                    print("   ✅ Announcement created successfully!")

                    # Take screenshot of result
                    page.screenshot(path='/tmp/announcement-created.png')
                    print("   📸 Result screenshot saved to /tmp/announcement-created.png")
            else:
                print("   ⚠️  New Announcement button not found")

            print("\n📊 Test Summary:")
            print(f"   - Total console messages: {len(console_messages)}")
            print(f"   - Total 500 errors: {len(errors_500)}")
            print(f"   - Page load: {'✅ Success' if not errors_500 else '❌ Failed'}")
            print(f"   - Create test: {'✅ Success' if not any('announcements.create' in err for err in network_errors if '500' in err) else '❌ Failed'}")

        except Exception as e:
            print(f"❌ Test failed with error: {e}")
            page.screenshot(path='/tmp/error-screenshot.png')
            print("📸 Error screenshot saved to /tmp/error-screenshot.png")
            raise
        finally:
            browser.close()
            print("\n✨ Test completed")

if __name__ == "__main__":
    test_announcements()