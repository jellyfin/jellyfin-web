import { type Page } from '@playwright/test';

export const USER_ID = 'user-123';
export const ACCESS_TOKEN = 'mock-access-token';

export async function setupBasicMocks(page: Page) {
  // Mock common endpoints to reduce noise
  await page.route('**/Items*', async (route) => {
    await route.fulfill({ status: 200, body: JSON.stringify({ Items: [], TotalRecordCount: 0 }) });
  });

  await page.route('**/Sessions*', async (route) => {
    await route.fulfill({ status: 200, body: JSON.stringify({ Sessions: [] }) });
  });
}

export async function login(page: Page, serverUrl?: string, username?: string, password?: string) {
  // Navigate to the app
  await page.goto('/web/', { waitUntil: 'commit', timeout: 15000 });

  // Wait for React to be ready
  await page.waitForSelector('#reactRoot', { state: 'attached', timeout: 30000 }).catch(() => {});

  // Wait for splash to disappear or continue
  await page.waitForFunction(() => {
    const splash = document.querySelector('.splashLogo');
    return splash === null || splash.parentElement === null;
  }, { timeout: 10000 }).catch(() => {
    console.log('Note: App showing splash screen, continuing with interaction...');
  });

  // Check for Select Server screen
  const serverUrlInput = page.getByRole('textbox', { name: /server|url|address/i }).first();
  const connectButton = page.getByRole('button', { name: /connect|add server/i }).first();

  if (await serverUrlInput.isVisible({ timeout: 3000 })) {
    // Prompt for server URL if not provided
    const server = serverUrl || process.env.JELLYFIN_SERVER || 'http://localhost:8096';
    console.log(`Connecting to server: ${server}`);
    await serverUrlInput.fill(server);
    await connectButton.click();
    await page.waitForTimeout(2000);
  }

  // Check for login screen
  const usernameInput = page.getByLabel(/username/i).or(page.getByRole('textbox', { name: /username/i })).first();

  if (await usernameInput.isVisible({ timeout: 5000 })) {
    // Prompt for credentials if not provided
    const user = username || process.env.JELLYFIN_USER || 'admin';
    const pass = password || process.env.JELLYFIN_PASSWORD || '';

    console.log(`Logging in as: ${user}`);
    await usernameInput.fill(user);

    const passwordInput = page.getByLabel(/password/i).or(page.getByRole('textbox', { name: /password/i })).first();
    if (await passwordInput.isVisible()) {
      await passwordInput.fill(pass);
    }

    const signInButton = page.getByRole('button', { name: /sign in|login|signin/i }).first();
    await signInButton.click();

    // Wait for login to complete
    await page.waitForTimeout(3000);
  }

  console.log('Login flow complete. App should be ready.');
}
