import { test, expect } from '@playwright/test';

test.describe('Full E2E Flow: Connect & Login', () => {
  test.beforeEach(async ({ page }) => {
    // Clear state to ensure we start at the beginning
    await page.addInitScript(() => localStorage.clear());
    
    // --- NETWORK MOCKS ---
    // We mock the network to ensure stability and not depend on the actual external URL being up/valid/compatible
    
    // 1. System Info (Used during connection check)
    await page.route('**/System/Info/Public', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          Id: 'server-id-123',
          Name: '2Active Design Server',
          StartupWizardCompleted: true,
          ProductName: 'Jellyfin Server',
          Version: '10.9.0'
        })
      });
    });

    // 2. Public Users (Displayed on Login page)
    await page.route('**/Users/Public', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { Id: 'user-1', Name: 'DemoUser', HasPassword: true, PrimaryImageTag: null }
        ])
      });
    });

    // 3. Authentication (Login action)
    await page.route('**/Users/AuthenticateByName', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          AccessToken: 'fake-jwt-token',
          User: { Id: 'user-1', Name: 'DemoUser' },
          SessionInfo: { Id: 'session-1' },
          ServerId: 'server-id-123'
        })
      });
    });

    // 4. User Me (Home page load)
    await page.route('**/Users/Me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          Id: 'user-1',
          Name: 'DemoUser',
          Policy: { IsAdministrator: true, IsDisabled: false }
        })
      });
    });

    // 5. User Views/Libraries (Home page content)
    await page.route('**/Users/*/Views', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          Items: [
            { Name: 'Movies', Id: 'lib-movies', Type: 'CollectionFolder', CollectionType: 'movies' },
            { Name: 'Music', Id: 'lib-music', Type: 'CollectionFolder', CollectionType: 'music' }
          ],
          TotalRecordCount: 2
        })
      });
    });
    
    // 6. General Items catch-all (prevents 404s on home)
    await page.route('**/Items*', async route => {
        if (route.request().url().includes('Views')) return route.continue();
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ Items: [], TotalRecordCount: 0 })
        });
    });
  });

  test('Connect to https://2activedesign.com and navigate to Home', async ({ page }) => {
    // 1. Initial Load - Expect redirect to Select Server
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    try {
        await expect(page).toHaveURL(/.*\/#?\/selectserver/, { timeout: 10000 });
    } catch (e) {
        // If not redirected, we might be seeing the "No Server Found" fallback
        await expect(page.getByText('No Server Found')).toBeVisible({ timeout: 5000 });
        await page.getByRole('button', { name: 'Add Server Manually' }).click();
        await expect(page).toHaveURL(/.*\/#?\/selectserver/);
    }
    
    // 2. Open "Add Server" Dialog
    // Using loose matching to catch "Add Server" button
    await page.getByRole('button', { name: 'Add Server' }).click();
    await expect(page.getByRole('heading', { name: 'Add Server' })).toBeVisible();

    // 3. Fill Server URL
    const targetUrl = 'https://2activedesign.com';
    await page.getByLabel('Server URL').fill(targetUrl);
    
    // 4. Connect
    await page.getByRole('button', { name: 'Connect' }).click();

    // 5. Verify Navigation to Login
    // The app should detect the server and route to /login
    await expect(page).toHaveURL(/.*\/login.*/);
    
    // 6. Handle Login UI
    // Depending on state, it might show user cards or manual login form.
    // If "Sign in manually" is visible (because we mocked a public user), click it.
    const manualSignButton = page.getByRole('button', { name: 'Sign in manually' });
    if (await manualSignButton.isVisible()) {
        await manualSignButton.click();
    }

    // 7. Enter Credentials
    await expect(page.getByLabel('Username')).toBeVisible();
    await page.getByLabel('Username').fill('DemoUser');
    await page.getByLabel('Password').fill('any_password');
    
    // 8. Submit Login
    await page.getByRole('button', { name: 'Sign in' }).click();

    // 9. Verify Home Page Load
    await expect(page).toHaveURL(/.*\/home/);
    
    // Verify basic Home UI elements are present
    // The "Movies" library we mocked should be visible
    await expect(page.getByText('Movies', { exact: true })).toBeVisible();
    await expect(page.getByText('Music', { exact: true })).toBeVisible();
  });
});
