import { expect as baseExpect, test as baseTest } from '@playwright/test';
import LoginPage from '../pages/login-page';
import RegisterPage from '../pages/register-page';
import BookStorePage from '../pages/book-store-page';
import BookDetailsPage from '../pages/book-details-page';
import ProfilePage from '../pages/profile-page';
import { ApiHelpers } from '../utils/api-helpers';
import { TestDataBuilder } from '../config/test-data';
import { loginViaUi } from '../utils/auth-flow';

type ApiTestUser = {
    userId: string;
    userName: string;
    password: string;
    token: string;
};

type Pages = {
    loginPage: LoginPage;
    registerPage: RegisterPage;
    bookStorePage: BookStorePage;
    bookDetailsPage: BookDetailsPage;
    profilePage: ProfilePage;
    apiHelpers: ApiHelpers;
    apiTestUser: ApiTestUser;
    loggedInApiUser: ApiTestUser;
};

const testPages = baseTest.extend<Pages>({
    loginPage: async ({ page }, use) => {
        await use(new LoginPage(page));
    },
    registerPage: async ({ page }, use) => {
        await use(new RegisterPage(page));
    },
    bookStorePage: async ({ page }, use) => {
        await use(new BookStorePage(page));
    },
    bookDetailsPage: async ({ page }, use) => {
        await use(new BookDetailsPage(page));
    },
    profilePage: async ({ page }, use) => {
        await use(new ProfilePage(page));
    },
    apiHelpers: async ({ request }, use) => {
        await use(new ApiHelpers(request));
    },
    apiTestUser: async ({ apiHelpers }, use) => {
        const user = TestDataBuilder.createRandomUser();
        const createdUser = await apiHelpers.createUserAndGetToken(user.userName, user.password);
        const apiTestUser = {
            ...createdUser,
            password: user.password,
        };

        try {
            await use(apiTestUser);
        } finally {
            // Generating a token invalidates the user's previous token in DemoQA.
            // Refresh it during teardown so tests that exercise token rotation
            // cannot leave their isolated account behind.
            const cleanupTokenResponse = await apiHelpers.generateToken(
                apiTestUser.userName,
                apiTestUser.password
            );
            const cleanupToken = cleanupTokenResponse.body.token ?? '';
            baseExpect(
                cleanupTokenResponse.status,
                `Failed to generate cleanup token for API test user ${apiTestUser.userId}`
            ).toBe(200);
            baseExpect(
                cleanupToken,
                `Cleanup token was empty for API test user ${apiTestUser.userId}`
            ).not.toBe('');

            const cleanupResponse = await apiHelpers.deleteUser(apiTestUser.userId, cleanupToken);
            baseExpect(
                cleanupResponse.status,
                `Failed to delete API test user ${apiTestUser.userId}`
            ).toBe(204);
        }
    },
    loggedInApiUser: async ({ page, apiTestUser }, use) => {
        await loginViaUi(page, apiTestUser);
        await use(apiTestUser);
    },
});

export const test = testPages;
export const expect = testPages.expect;

export type { ApiTestUser };
