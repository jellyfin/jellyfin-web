import { test, expect } from '@playwright/test';

test('wizard starts on first landing', async ({ page }) => {
    // navigate to
    await page.goto('http://localhost:8096/');

    // expect to be redirected the first time
    await expect(page).toHaveURL('http://localhost:8096/web/#/wizard/start');

    await expect(page.getByRole('heading', { name: 'Welcome to Jellyfin!' })).toBeVisible();
});
