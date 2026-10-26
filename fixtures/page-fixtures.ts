import { test as baseTest } from '@playwright/test';
import LoginPage from '@pages/login-page';
import RegisterPage from '@pages/register-page';
import BookStorePage from '@pages/book-store-page';
import BookDetailsPage from '@pages/book-details-page';
import ProfilePage from '@pages/profile-page';
import { ApiHelpers } from '@utils/api-helpers';
import { TestDataBuilder } from '@config/test-data';
import { loginViaUi } from '@utils/auth-flow';
import { runWithApiTestUser, type ApiTestUser } from '@utils/api-test-user';
import { recordLeakedUser } from '@utils/test-user-registry';
import { getApiBaseUrl } from '@config/environments';

type TestOptions = {
    apiBaseUrl: string;
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

const testPages = baseTest.extend<Pages & TestOptions>({
    apiBaseUrl: [getApiBaseUrl(), { option: true }],
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
    apiHelpers: async ({ request, apiBaseUrl }, use) => {
        await use(new ApiHelpers(request, apiBaseUrl));
    },
    apiTestUser: async ({ apiHelpers }, use, testInfo) => {
        const credentials = TestDataBuilder.createRandomUser();

        await runWithApiTestUser(apiHelpers, credentials, use, async (leaked) => {
            // Cleanup failed; annotate and retry in globalTeardown.
            testInfo.annotations.push({
                type: 'cleanup-failed',
                description: `${leaked.userName} (${leaked.userId}): ${leaked.reason}`,
            });

            await recordLeakedUser(leaked);
        });
    },
    loggedInApiUser: async ({ page, apiTestUser }, use) => {
        await loginViaUi(page, apiTestUser);
        await use(apiTestUser);
    },
});

export const test = testPages;
export const expect = testPages.expect;

export type { ApiTestUser, TestOptions };
