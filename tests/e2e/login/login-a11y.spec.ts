import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@fixtures/page-fixtures';

test.describe(
    'Login accessibility',
    {
        tag: ['@e2e', '@a11y', '@login'],
    },
    () => {
        test('Login page has no critical accessibility violations', async ({ page, loginPage }) => {
            await loginPage.goToLogin();
            await loginPage.verifyLoginPageElements();

            // Scope the scan to the application. DemoQA embeds third-party ad iframes
            // whose creatives ship unlabelled images, and the ToolsQA banner is upstream
            // markup — neither is ours to fix, and the ad slots vary between page loads.
            // Excluding those regions keeps every rule (including `image-alt`) active on
            // the application's own markup, which disabling the rule outright would not.
            const results = await new AxeBuilder({ page })
                .withTags(['wcag2a', 'wcag2aa'])
                .exclude('iframe[id^="google_ads_iframe"]')
                .exclude('img[src*="Toolsqa"]')
                .analyze();

            await test.info().attach('axe-violations', {
                body: Buffer.from(JSON.stringify(results.violations, null, 2)),
                contentType: 'application/json',
            });

            const critical = results.violations.filter(
                (violation) => violation.impact === 'critical'
            );
            expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
        });
    }
);
