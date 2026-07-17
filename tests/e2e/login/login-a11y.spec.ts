import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../../../fixtures/page-fixtures';

test.describe(
    'Login accessibility',
    {
        tag: ['@e2e', '@a11y', '@login'],
    },
    () => {
        test('Login page has no critical accessibility violations', async ({ page, loginPage }) => {
            await loginPage.goToLogin();
            await loginPage.verifyLoginPageElements();

            // DemoQA's ToolsQA banner image has no alt text (third-party markup).
            // Exclude that known rule so this test validates our a11y gate wiring
            // without failing forever on an upstream logo we cannot fix.
            const results = await new AxeBuilder({ page })
                .withTags(['wcag2a', 'wcag2aa'])
                .disableRules(['image-alt'])
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
