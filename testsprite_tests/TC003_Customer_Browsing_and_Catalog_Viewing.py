import asyncio
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None
    
    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()
        
        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )
        
        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)
        
        # Open a new page in the browser context
        page = await context.new_page()
        
        # Navigate to your target URL and wait until the network request is committed
        await page.goto("http://localhost:8080", wait_until="commit", timeout=10000)
        
        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=3000)
        except async_api.Error:
            pass
        
        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass
        
        # Interact with the page elements to simulate user flow
        # -> Browse product categories by clicking on a category button to filter products accordingly.
        frame = context.pages[-1]
        # Click on 'Entradas' category button to browse products in this category
        elem = frame.locator('xpath=html/body/div/div[2]/section/div/div/button[3]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click on a product (e.g., 'Ensalada César') to access the product detail page.
        frame = context.pages[-1]
        # Click on 'Ensalada César' product to view product details
        elem = frame.locator('xpath=html/body/div/div[2]/div/section[2]/div/div[2]/div[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=Volver').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Ensalada César').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=$ 12,99').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Bs 3.592,74').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Descripción').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Lechuga romana fresca, crutones artesanales, parmesano y nuestra salsa césar especial').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Personaliza tu pedido').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Quesito').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=+').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=$ 1,00').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Bs 276,58').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=© 2025. Todos los derechos reservados.').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Menu generato por PideAI').first).to_be_visible(timeout=30000)
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    