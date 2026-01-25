import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI !== undefined ? 2 : 0,
    workers: process.env.CI !== undefined ? 1 : undefined,
    reporter: 'html',
    timeout: 120000,
    use: {
        baseURL: 'http://localhost:5173/web/',
        trace: 'on-first-retry'
    },
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                launchOptions: {
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                }
            }
        }
    ],
    webServer: {
        command: 'npx vite preview --port 5173',
        url: 'http://localhost:5173/web/',
        reuseExistingServer: process.env.CI === undefined
    }
});
