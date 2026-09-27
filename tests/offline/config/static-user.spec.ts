import { expect, test } from '@playwright/test';
import { getValidUserCredentials } from '@config/environments';

test.describe('Static user credentials', { tag: ['@offline'] }, () => {
    test('come from the environment and have no built-in account', () => {
        const previousUser = process.env.DEMOQA_USERNAME;
        const previousPassword = process.env.DEMOQA_PASSWORD;

        try {
            delete process.env.DEMOQA_USERNAME;
            delete process.env.DEMOQA_PASSWORD;

            expect(() => getValidUserCredentials()).toThrow(/DEMOQA_USERNAME and DEMOQA_PASSWORD/);

            process.env.DEMOQA_USERNAME = 'configured-user';
            expect(() => getValidUserCredentials()).toThrow(/DEMOQA_USERNAME and DEMOQA_PASSWORD/);

            process.env.DEMOQA_PASSWORD = 'configured-pass';
            expect(getValidUserCredentials()).toEqual({
                userName: 'configured-user',
                password: 'configured-pass',
            });
        } finally {
            restoreEnv('DEMOQA_USERNAME', previousUser);
            restoreEnv('DEMOQA_PASSWORD', previousPassword);
        }
    });
});

function restoreEnv(name: 'DEMOQA_USERNAME' | 'DEMOQA_PASSWORD', value: string | undefined): void {
    if (value === undefined) {
        delete process.env[name];
        return;
    }

    process.env[name] = value;
}
