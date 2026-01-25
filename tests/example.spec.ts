import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  // Navigate to the app
  await page.goto('/web/', { waitUntil: 'commit', timeout: 15000 });

  // Wait for the page to load
  await page.waitForSelector('#reactRoot', { state: 'attached', timeout: 30000 });

  // Verify the title contains Jellyfin
  await expect(page).toHaveTitle(/Jellyfin/i);
});
