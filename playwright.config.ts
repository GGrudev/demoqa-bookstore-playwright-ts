import { defineConfig, devices } from '@playwright/test';
import { getEnvironment } from './config/environments';
import { STATIC_USER_STORAGE_STATE } from './utils/auth-storage';

const isCI = !!process.env.CI;
const isHeadless = process.env.HEADLESS === 'true' || isCI;
const env = getEnvironment();

const desktopChrome = {
    ...devices['Desktop Chrome'],
    viewport: { width: 1920, height: 1080 },
};

// Specs matching this pattern reuse the shared authenticated session and run in
// the dedicated `authenticated` project (which depends on the `setup` project).
const AUTHENTICATED_SPECS = /.*\.authenticated\.spec\.ts/;
const API_SPECS = /.*\/api\/.*\.spec\.ts/;

const ciWorkers = process.env.PLAYWRIGHT_WORKERS
    ? Number.parseInt(process.env.PLAYWRIGHT_WORKERS, 10)
    : 2;

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: isCI,
    retries: isCI ? 2 : 0,
    workers: isCI ? ciWorkers : undefined,

    reporter: [
        ['list'],
        [
            'html',
            {
                open: isCI ? 'never' : 'on-failure',
                outputFolder: 'playwright-report',
            },
        ],
        ['junit', { outputFile: 'test-results/junit.xml' }],
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
            name: 'setup',
            testMatch: /.*\.setup\.ts/,
            use: desktopChrome,
        },
        {
            // Request-context API tests — no browser dependency in CI when this
            // project is selected alone (`npm run test:api`).
            name: 'api',
            testMatch: API_SPECS,
        },
        {
            name: 'chromium',
            use: desktopChrome,
            // Authenticated specs and API specs have dedicated projects.
            testIgnore: [AUTHENTICATED_SPECS, API_SPECS],
        },
        {
            name: 'authenticated',
            testMatch: AUTHENTICATED_SPECS,
            dependencies: ['setup'],
            use: {
                ...desktopChrome,
                storageState: STATIC_USER_STORAGE_STATE,
            },
        },
    ],
});
