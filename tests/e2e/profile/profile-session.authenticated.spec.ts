import { test, expect } from '@fixtures/page-fixtures';
import { TestDataBuilder } from '@config/test-data';

// These specs run in the `authenticated` project, which reuses the session
// created once by tests/auth.setup.ts via storageState (no per-test UI login).
const staticUser = TestDataBuilder.createValidUser();

test.describe(
    'Profile - Authenticated session',
    {
        tag: ['@e2e', '@profile'],
    },
    () => {
        test('Logged in user can view their profile', async ({ profilePage }) => {
            await test.step('Navigate to profile', async () => {
                await profilePage.goToProfile();
            });

            await test.step('Verify profile page elements', async () => {
                await profilePage.header.expectLoggedIn(staticUser.userName);
                await profilePage.expectProfileControlsVisible();
            });
        });

        test('Navigate from profile to book store', async ({ profilePage, bookStorePage }) => {
            await test.step('Go to profile', async () => {
                await profilePage.goToProfile();
                await profilePage.header.expectLoggedIn(staticUser.userName);
            });

            await test.step('Click Go To Book Store button', async () => {
                await profilePage.navigateToBookStore();
            });

            await test.step('Verify book store page is displayed', async () => {
                await expect(bookStorePage.page).toHaveURL(/\/books$/);
                await bookStorePage.expectBooksTableVisible();
            });
        });

        test('Logout from profile page', async ({ profilePage, loginPage }) => {
            await test.step('Go to profile', async () => {
                await profilePage.goToProfile();
                await profilePage.header.expectLoggedIn(staticUser.userName);
            });

            await test.step('Logout from profile', async () => {
                await profilePage.header.logout();
            });

            await test.step('Verify redirected to login page', async () => {
                await loginPage.expectOnLoginPage();
            });
        });
    }
);
