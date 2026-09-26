import { config as loadEnv } from 'dotenv';
import { defineConfig, devices } from '@playwright/test';
import { getEnvironment } from './config/environments';
import { STATIC_USER_STORAGE_STATE } from './utils/auth-storage';
import type { TestOptions } from './fixtures/page-fixtures';

loadEnv({ quiet: true });

const isCI = !!process.env.CI;
const isHeadless = process.env.HEADLESS === 'true' || isCI;
const env = getEnvironment();

const desktopViewport = { width: 1920, height: 1080 };
const desktopChrome = { ...devices['Desktop Chrome'], viewport: desktopViewport };
const desktopFirefox = { ...devices['Desktop Firefox'], viewport: desktopViewport };
const desktopSafari = { ...devices['Desktop Safari'], viewport: desktopViewport };

// Authenticated specs reuse storageState from the setup project.
const AUTHENTICATED_SPECS = /.*\.authenticated\.spec\.ts/;
const API_SPECS = /.*\/api\/.*\.spec\.ts/;
const OFFLINE_SPECS = /.*\/offline\/.*\.spec\.ts/;

const ciWorkers = process.env.PLAYWRIGHT_WORKERS
    ? Number.parseInt(process.env.PLAYWRIGHT_WORKERS, 10)
    : 2;

export default defineConfig<TestOptions>({
    testDir: './tests',
    globalTeardown: './utils/global-teardown.ts',
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
        ...(isCI ? [['github'] as const] : []),
    ],

    timeout: env.timeout.default,

    expect: {
        timeout: 5000,
    },

    use: {
        baseURL: env.baseUrl,
        apiBaseUrl: env.apiBaseUrl,
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
            name: 'offline',
            testMatch: OFFLINE_SPECS,
        },
        {
            name: 'api',
            testMatch: API_SPECS,
        },
        {
            name: 'chromium',
            use: desktopChrome,
            testIgnore: [AUTHENTICATED_SPECS, API_SPECS, OFFLINE_SPECS],
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
        {
            name: 'firefox',
            use: desktopFirefox,
            testIgnore: [AUTHENTICATED_SPECS, API_SPECS, OFFLINE_SPECS],
        },
        {
            name: 'webkit',
            use: desktopSafari,
            testIgnore: [AUTHENTICATED_SPECS, API_SPECS, OFFLINE_SPECS],
        },
    ],
});
