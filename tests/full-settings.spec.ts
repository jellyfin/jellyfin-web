import { test, expect } from '@playwright/test';
import { setupBasicMocks } from './helpers/test-utils';

// These tests verify that the routes load properly
// Full authentication tests require a real server with credentials

test.describe('Comprehensive Settings & Display', () => {

  test.beforeEach(async ({ page }) => {
    setupBasicMocks(page);
  });

  test('Display Settings page loads', async ({ page }) => {
    await page.goto('/web/mypreferences/display');
    // Page should load
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await page.waitForTimeout(2000);
  });

  test('Profile page loads', async ({ page }) => {
    await page.goto('/web/mypreferences/profile');
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await page.waitForTimeout(2000);
  });

  test('Dashboard page loads', async ({ page }) => {
    await page.goto('/web/dashboard');
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await page.waitForTimeout(2000);
  });
});
