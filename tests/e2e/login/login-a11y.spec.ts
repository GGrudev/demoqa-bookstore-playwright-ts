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

            // Ads and the ToolsQA banner are third-party; leave image-alt on for the rest.
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
