import { test, expect } from '@playwright/test';

test.describe('Server Selection & Auth Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear local storage to ensure fresh start
    await page.addInitScript(() => {
      localStorage.clear();
    });
  });

  test('Root redirect to Select Server when no connection', async ({ page }) => {
    // Navigate to root
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Allow connection attempts to settle

    // Should redirect to /selectserver OR show "No Server Found" fallback
    // The fallback also allows navigation to selectserver
    try {
        await expect(page).toHaveURL(/.*\/#?\/selectserver/, { timeout: 10000 });
    } catch (e) {
        // If not redirected, we might be seeing the "No Server Found" fallback
        await expect(page.getByText('No Server Found')).toBeVisible({ timeout: 5000 });
        await page.getByRole('button', { name: 'Add Server Manually' }).click();
        await expect(page).toHaveURL(/.*\/#?\/selectserver/);
    }
    
    // Should see "Select Server" heading
    await expect(page.getByRole('heading', { name: 'Select Server' })).toBeVisible();
  });

  test('Developer Settings persistence', async ({ page }) => {
    await page.goto('#/selectserver');
    await page.waitForTimeout(2000); // Allow hydration and effect settlement

    // Wait for loading to finish
    await expect(page.getByText('Loading')).not.toBeVisible({ timeout: 15000 });

    // Open Developer Settings (use text to be safe)
    await page.getByText('Developer Settings').click();
    
    // Check "Use Dev Proxy"
    const proxyCheckbox = page.getByLabel('Use Dev Proxy');
    await proxyCheckbox.check();
    
    // Fill in Server URL
    const serverInput = page.getByLabel('Server Base URL (Target)');
    await serverInput.fill('https://demo.jellyfin.org');
    
    // Save
    await page.getByText('Save & Apply').click();

    // Verify dialog closed
    await expect(page.getByText('Developer Settings').first()).toBeVisible(); // Button is visible again

    // Reload page to verify persistence (simulating how dev config works)
    await page.reload();
    await page.waitForTimeout(2000);
    await expect(page.getByText('Loading')).not.toBeVisible({ timeout: 15000 });
    
    // Re-open settings
    await page.getByText('Developer Settings').click();
    
    // Verify values persisted
    await expect(page.getByLabel('Use Dev Proxy')).toBeChecked();
    await expect(page.getByLabel('Server Base URL (Target)')).toHaveValue('https://demo.jellyfin.org');
  });

  test('Manual Server Add flow', async ({ page }) => {
    await page.goto('#/selectserver');
    await page.waitForTimeout(2000);

    // Wait for loading to finish
    await expect(page.getByText('Loading')).not.toBeVisible({ timeout: 15000 });

    // Click "Add Server" - try specific text match
    await page.getByText('Add Server').first().click();

    // Expect dialog
    await expect(page.getByRole('heading', { name: 'Add Server' })).toBeVisible();

    // Enter URL
    await page.getByLabel('Server URL').fill('https://demo.jellyfin.org');

    // Click Connect
    // Note: Connect button might be disabled initially or pending
    await expect(page.getByRole('button', { name: 'Connect' })).toBeEnabled();
  });
});
