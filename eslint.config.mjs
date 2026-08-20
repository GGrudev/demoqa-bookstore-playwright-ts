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
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
            '@typescript-eslint/no-explicit-any': 'error',
            // Page-object helpers like verifyLoginPageElements count as assertions.
            'playwright/expect-expect': [
                'error',
                { assertFunctionPatterns: ['^verify', '^expect'] },
            ],
        },
    }
);
