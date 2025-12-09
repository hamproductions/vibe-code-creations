from playwright.sync_api import sync_playwright

def verify_homepage_links(page):
    # Navigate to the root index.html
    # Since we are using static files, we can use the file:// protocol
    import os
    file_path = os.path.abspath('index.html')
    page.goto(f'file://{file_path}')

    # Scroll down to make sure the bottom is visible
    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")

    # Take a screenshot
    page.screenshot(path='verification/homepage_with_flashbang.png')

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_homepage_links(page)
        finally:
            browser.close()
