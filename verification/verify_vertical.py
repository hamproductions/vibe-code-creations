from playwright.sync_api import sync_playwright

def verify_darts(page):
    # Capture console logs
    page.on("console", lambda msg: print(f"BROWSER LOG: {msg.text}"))

    # Go to the page
    page.goto("http://localhost:8080/darts-counter/")

    # Check Initial State
    print("Checking initial state...")
    page.wait_for_selector("#score-display")
    assert page.locator("#score-display").inner_text() == "501"

    # Check Tablet Portrait Layout (Vertical Tablet)
    # iPad Mini is 768x1024
    page.set_viewport_size({"width": 768, "height": 1024})
    print("Checking Tablet Portrait Layout...")
    page.wait_for_timeout(500)

    # In Tablet (md), body should have overflow-hidden (fixed dashboard)
    body_class = page.locator("body").get_attribute("class")
    assert "md:overflow-hidden" in body_class
    # It should show 3 columns
    # We can verify specific elements are visible
    assert page.locator("#s60-stat-d").is_visible() # Stats panel
    assert page.locator("#checkout-guide").is_visible() # Right panel (initially hidden opacity but element exists)

    # Take Screenshot
    page.screenshot(path="verification/tablet_portrait.png")

    # Check Mobile Portrait Layout (Vertical Phone)
    # iPhone SE is 375x667
    page.set_viewport_size({"width": 375, "height": 667})
    print("Checking Mobile Portrait Layout...")
    page.wait_for_timeout(500)

    # On mobile, stats panel (desktop version) is hidden
    assert not page.locator("#s60-stat-d").is_visible()
    # Mobile stats summary is visible
    assert page.locator("#s60-stat-m").is_visible()

    # Verify Scrolling is possible?
    # We can check if scrollHeight > clientHeight for body or app-root
    # Since we added min-h-full and overflow-auto to body
    # Let's add some content (history) implicitly by scoring?
    # Actually the mobile layout is stacked, so it might be tall.
    # But currently history table is HIDDEN on mobile (desktop left panel hidden).
    # So mobile view is just Score + Controls + Video/Checkout.
    # It likely fits in 667px.

    page.screenshot(path="verification/mobile_portrait.png")

    print("Verification Complete!")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_darts(page)
        finally:
            browser.close()
