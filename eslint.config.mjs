import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default tseslint.config(
    {
        ignores: [
            'node_modules/',
            'playwright-report/',
            'test-results/',
            'blob-report/',
            '.auth/',
            '.test-users/',
        ],
    },
    js.configs.recommended,
    tseslint.configs.recommended,
    {
        files: ['**/*.ts'],
        ...playwright.configs['flat/recommended'],
    },
    {
        files: ['**/*.ts'],
        rules: {
            // Errors, not warnings: `npm run lint` also runs with --max-warnings=0, so
            // anything reported here fails CI rather than scrolling past in the log.
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
            '@typescript-eslint/no-explicit-any': 'error',
            // Assertions legitimately live in page-object methods (`verifyLoginPageElements`,
            // `expectLoggedIn`), so calling one counts as asserting for this rule.
            'playwright/expect-expect': [
                'error',
                { assertFunctionPatterns: ['^verify', '^expect'] },
            ],
        },
    }
);
