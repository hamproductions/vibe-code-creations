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

    # Check Layout - Stats Section (Left Panel)
    page.set_viewport_size({"width": 1280, "height": 800})
    print("Checking Desktop Layout...")
    page.wait_for_timeout(500)

    # Verify new stats exist
    assert page.locator("#s60-stat-d").is_visible()
    assert page.locator("#s100-stat-d").is_visible()

    # Verify Checkout Guide is hidden initially
    assert "opacity-0" in page.locator("#checkout-guide").get_attribute("class")

    # Mock Score Submission to test Checkout Guide
    print("Simulating score to trigger Checkout Guide...")

    # 1. Score 180
    print("Submitting 180...")
    page.evaluate("window.submitScore(180)")

    # Wait for the short unlock timeout (2000ms) + a bit buffer
    page.wait_for_timeout(2500)

    # Score should be 321
    current_score = page.locator("#score-display").inner_text()
    print(f"Score after 180: {current_score}")
    assert current_score == "321"

    # 2. Score 151 (Should work now that lock automatically releases after 2s)
    print("Submitting 151...")
    page.evaluate("window.submitScore(151)")
    page.wait_for_timeout(1000)

    # Score should be 170
    current_score = page.locator("#score-display").inner_text()
    print(f"Score after 151: {current_score}")
    assert current_score == "170"

    # Checkout Guide should be visible now
    assert "opacity-0" not in page.locator("#checkout-guide").get_attribute("class")
    checkout_text = page.locator("#checkout-path").inner_text()
    print(f"Checkout shown: {checkout_text}")
    assert "T20 T20 Bull" in checkout_text

    # Check Stats update
    s60 = page.locator("#s60-stat-d").inner_text()
    s100 = page.locator("#s100-stat-d").inner_text()
    print(f"Stats: 60+={s60}, 100+={s100}")
    assert s60 == "2"
    assert s100 == "2"

    # Take Screenshot Desktop
    page.screenshot(path="verification/desktop_layout.png")

    # Check Tablet Layout
    page.set_viewport_size({"width": 768, "height": 1024})
    page.wait_for_timeout(500)
    page.screenshot(path="verification/tablet_layout.png")

    # Check Mobile Layout
    page.set_viewport_size({"width": 375, "height": 800})
    page.wait_for_timeout(500)
    # Check mobile stats summary
    assert page.locator("#s60-stat-m").is_visible()
    page.screenshot(path="verification/mobile_layout.png")

    print("Verification Complete!")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_darts(page)
        finally:
            browser.close()
