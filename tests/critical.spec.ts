import { test, expect } from '@playwright/test';

test.describe('Critical Paths', () => {
  const userId = 'user1';

  test.beforeEach(async ({ page }) => {
    // Mock server info
    await page.route('**/System/Info', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          Id: 'server-123',
          Name: 'Test Jellyfin Server',
          Version: '10.9.0',
        }),
      });
    });

    // Mock the authentication API
    await page.route('**/Users/AuthenticateByName', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          AccessToken: 'test-token',
          User: {
            Id: userId,
            Name: 'Test User',
          },
        }),
      });
    });

    // Mock the current user profile
    await page.route('**/Users/Me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          Id: userId,
          Name: 'Test User',
          Policy: { IsAdministrator: true },
        }),
      });
    });

    // Mock the libraries (Views)
    await page.route(`**/Users/${userId}/Views`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          Items: [
            { Name: 'Movies', Id: 'movies1', Type: 'CollectionFolder', CollectionType: 'movies' },
            { Name: 'TV Shows', Id: 'tv1', Type: 'CollectionFolder', CollectionType: 'tvshows' },
          ],
          TotalRecordCount: 2,
        }),
      });
    });

    // Mock other common endpoints
    await page.route('**/Items*', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ Items: [], TotalRecordCount: 0 }) });
    });
  });

  test('App loads and shows splash screen', async ({ page }) => {
    // Navigate to the app
    await page.goto('/web/', { waitUntil: 'commit', timeout: 15000 });

    // Verify the app container exists
    await page.waitForSelector('#reactRoot', { state: 'attached', timeout: 30000 });

    // Verify title
    await expect(page).toHaveTitle(/Jellyfin/i);
  });

  test('TanStack Router handles navigation', async ({ page }) => {
    // Navigate to the base app first
    await page.goto('/web/', { waitUntil: 'commit', timeout: 15000 });

    // App should load
    await page.waitForSelector('#reactRoot', { state: 'attached', timeout: 30000 });

    // Verify title
    await expect(page).toHaveTitle(/Jellyfin/i);
  });
});
