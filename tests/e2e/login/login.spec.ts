import { test, expect } from '../../../fixtures/page-fixtures';
import { TestDataBuilder } from '../../../config/test-data';

test.describe(
    'Login functionality',
    {
        tag: ['@e2e', '@login'],
    },
    () => {
        test.beforeEach(async ({ loginPage }) => {
            await loginPage.goToLogin();
        });

        test(
            'Verify login page elements are displayed',
            {
                tag: ['@smoke'],
            },
            async ({ loginPage }) => {
                await test.step('Verify all login form elements are visible', async () => {
                    await loginPage.verifyLoginPageElements();
                });
            }
        );

        test(
            'Successfully login with valid credentials',
            {
                tag: ['@smoke'],
            },
            async ({ loginPage }) => {
                const validUser = TestDataBuilder.createValidUser();

                await test.step('Login with valid credentials', async () => {
                    await loginPage.login(validUser.userName, validUser.password);
                });

                await test.step('Verify user is logged in', async () => {
                    await expect(loginPage.page).toHaveURL(/\/profile$/);
                    await loginPage.header.expectLoggedIn(validUser.userName);
                });
            }
        );

        test('Login fails with invalid credentials', async ({ loginPage }) => {
            const invalidUser = TestDataBuilder.createInvalidUser();

            await test.step('Attempt login with invalid credentials', async () => {
                await loginPage.login(invalidUser.userName, invalidUser.password);
            });

            await test.step('Verify error message is displayed', async () => {
                await loginPage.verifyInvalidLoginMessage();
            });
        });

        test('Login fails with empty credentials', async ({ loginPage }) => {
            await test.step('Submit empty credentials and verify validation', async () => {
                await loginPage.verifyEmptyCredentialsRejected();
            });
        });

        test('Logout after successful login', async ({ loginPage }) => {
            const validUser = TestDataBuilder.createValidUser();

            await test.step('Login with valid credentials', async () => {
                await loginPage.login(validUser.userName, validUser.password);
                await loginPage.header.expectLoggedIn(validUser.userName);
            });

            await test.step('Logout and verify login page is displayed', async () => {
                await loginPage.header.logout();
                await loginPage.expectOnLoginPage();
            });
        });

        test('Navigate to register page from login', async ({ loginPage, registerPage }) => {
            await test.step('Click New User button', async () => {
                await loginPage.goToRegister();
            });

            await test.step('Verify register page is displayed', async () => {
                await expect(registerPage.page).toHaveURL(/\/register$/);
                await registerPage.verifyRegisterPageElements();
            });
        });
    }
);
