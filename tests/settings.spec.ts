import { test, expect } from '@playwright/test';
import { setupBasicMocks } from './helpers/test-utils';

// Skip settings tests - require full authentication flow with real server
// To enable: set JELLYFIN_SERVER, JELLYFIN_USER, JELLYFIN_PASSWORD env vars

test.describe.skip('Persistent Settings Flow', () => {

  test.beforeEach(async ({ page }) => {
    await setupBasicMocks(page);
  });

  test('Save and Retrieve Playback Settings', async ({ page }) => {
    test.skip(true, 'Requires authentication');
  });

  test('Display Preferences persistence via LocalStorage fallback', async ({ page }) => {
    test.skip(true, 'Requires authentication');
  });
});
