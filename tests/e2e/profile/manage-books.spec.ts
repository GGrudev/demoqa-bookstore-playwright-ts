import { test, expect } from '../../../fixtures/page-fixtures';
import { TestDataBuilder } from '../../../config/test-data';

test.describe(
    'Profile - Manage book collection',
    {
        tag: ['@e2e', '@profile'],
    },
    () => {
        test(
            'Profile page shows not logged in message for unauthenticated users',
            {
                tag: ['@smoke'],
            },
            async ({ profilePage }) => {
                await test.step('Navigate to profile without login', async () => {
                    await profilePage.goToProfile();
                });

                await test.step('Verify not logged in message', async () => {
                    await profilePage.verifyNotLoggedIn();
                });
            }
        );

        test('Logged in user can view their profile', async ({ loginPage, profilePage }) => {
            const validUser = TestDataBuilder.createValidUser();

            await test.step('Login with valid credentials', async () => {
                await loginPage.goToLogin();
                await loginPage.login(validUser.userName, validUser.password);
                await loginPage.verifyLoggedInState(validUser.userName);
            });

            await test.step('Navigate to profile', async () => {
                await profilePage.goToProfile();
            });

            await test.step('Verify profile page elements', async () => {
                await profilePage.verifyLoggedInProfile(validUser.userName);
                await expect(profilePage.deleteAccountButton).toBeVisible();
                await expect(profilePage.deleteAllBooksButton).toBeVisible();
                await expect(profilePage.goToBookStoreButton).toBeVisible();
            });
        });

        test('Navigate from profile to book store', async ({
            loginPage,
            profilePage,
            bookStorePage,
        }) => {
            const validUser = TestDataBuilder.createValidUser();

            await test.step('Login and go to profile', async () => {
                await loginPage.goToLogin();
                await loginPage.login(validUser.userName, validUser.password);
                await loginPage.verifyLoggedInState(validUser.userName);
                await profilePage.goToProfile();
            });

            await test.step('Click Go To Book Store button', async () => {
                await profilePage.navigateToBookStore();
            });

            await test.step('Verify book store page is displayed', async () => {
                await expect(bookStorePage.booksTable).toBeVisible();
            });
        });

        test(
            'API-created collection is visible in profile',
            {
                tag: ['@smoke'],
            },
            async ({ apiHelpers, apiTestUser, loginPage, profilePage }) => {
                const bookToAdd = TestDataBuilder.getKnownBooks()[0];

                await test.step('Prepare user collection through API', async () => {
                    const response = await apiHelpers.addBooksToUser(
                        apiTestUser.userId,
                        apiTestUser.token,
                        [bookToAdd.isbn]
                    );

                    expect(response.status).toBe(201);
                });

                await test.step('Login through UI with the API-created user', async () => {
                    await loginPage.goToLogin();
                    await loginPage.login(apiTestUser.userName, apiTestUser.password);
                    await loginPage.verifyLoggedInState(apiTestUser.userName);
                });

                await test.step('Verify the API-created collection in the UI profile', async () => {
                    await profilePage.goToProfile();
                    await profilePage.verifyLoggedInProfile(apiTestUser.userName);
                    await profilePage.verifyBookInProfile(bookToAdd.title);
                });
            }
        );

        test('Logout from profile page', async ({ loginPage, profilePage }) => {
            const validUser = TestDataBuilder.createValidUser();

            await test.step('Login and go to profile', async () => {
                await loginPage.goToLogin();
                await loginPage.login(validUser.userName, validUser.password);
                await loginPage.verifyLoggedInState(validUser.userName);
                await profilePage.goToProfile();
            });

            await test.step('Logout from profile', async () => {
                await profilePage.logout();
            });

            await test.step('Verify redirected to login page', async () => {
                await expect(loginPage.loginButton).toBeVisible();
            });
        });
    }
);
