import { defineConfig, devices } from '@playwright/test';
import { getEnvironment } from './config/environments';

const isCI = !!process.env.CI;
const isHeadless = process.env.HEADLESS === 'true' || isCI;
const env = getEnvironment();

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: isCI,
    retries: isCI ? 2 : 0,
    workers: isCI ? 1 : undefined,

    reporter: [
        [
            'html',
            {
                open: isCI ? 'never' : 'on-failure',
                outputFolder: 'playwright-report',
            },
        ],
    ],

    timeout: env.timeout.default,

    expect: {
        timeout: 5000,
    },

    use: {
        baseURL: env.baseUrl,
        headless: isHeadless,
        trace: isCI ? 'on-first-retry' : 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: isCI ? 'retain-on-failure' : 'off',
        navigationTimeout: env.timeout.navigation,
        actionTimeout: env.timeout.action,
    },

    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1920, height: 1080 },
            },
        },
    ],
});
