import { config as loadEnv } from 'dotenv';
import { defineConfig, devices } from '@playwright/test';
import { getEnvironment } from './config/environments';
import { STATIC_USER_STORAGE_STATE } from './utils/auth-storage';
import type { TestOptions } from './fixtures/page-fixtures';

// Load local `.env` before reading DEMOQA_* / ENV values. CI injects secrets via
// the workflow environment, so an absent `.env` file is fine there.
loadEnv({ quiet: true });

const isCI = !!process.env.CI;
const isHeadless = process.env.HEADLESS === 'true' || isCI;
const env = getEnvironment();

const desktopViewport = { width: 1920, height: 1080 };
const desktopChrome = { ...devices['Desktop Chrome'], viewport: desktopViewport };
const desktopFirefox = { ...devices['Desktop Firefox'], viewport: desktopViewport };
const desktopSafari = { ...devices['Desktop Safari'], viewport: desktopViewport };

// Specs matching this pattern reuse the shared authenticated session and run in
// the dedicated `authenticated` project (which depends on the `setup` project).
const AUTHENTICATED_SPECS = /.*\.authenticated\.spec\.ts/;
const API_SPECS = /.*\/api\/.*\.spec\.ts/;
const OFFLINE_SPECS = /.*\/offline\/.*\.spec\.ts/;

const ciWorkers = process.env.PLAYWRIGHT_WORKERS
    ? Number.parseInt(process.env.PLAYWRIGHT_WORKERS, 10)
    : 2;

export default defineConfig<TestOptions>({
    testDir: './tests',
    // Retries deletion of any isolated user whose per-test cleanup failed, so a
    // teardown hiccup cannot strand accounts on DemoQA. No-op when nothing leaked.
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
        // Annotates failures inline on the PR diff, so a reviewer sees them without
        // opening the job log or downloading the HTML report artifact.
        ...(isCI ? [['github'] as const] : []),
    ],

    timeout: env.timeout.default,

    expect: {
        timeout: 5000,
    },

    use: {
        baseURL: env.baseUrl,
        // Consumed by the `apiHelpers` fixture. Kept beside `baseURL` so both hosts are
        // declared in one place and either can be overridden per project.
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
            // Schema contracts and ApiHelpers behaviour against recorded payloads and a
            // local stub server. No browser and no DemoQA traffic, so this project gates
            // every push and pull request (`npm run test:offline`).
            name: 'offline',
            testMatch: OFFLINE_SPECS,
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
            // Authenticated, API, and offline specs have dedicated projects.
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
        // Chromium gates every run; these two are opt-in via `npm run test:cross-browser`
        // or the regression workflow. See "Cross-browser strategy" in the README.
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
