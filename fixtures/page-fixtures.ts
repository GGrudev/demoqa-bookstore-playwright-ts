import { test as baseTest } from '@playwright/test';
import LoginPage from '../pages/login-page';
import RegisterPage from '../pages/register-page';
import BookStorePage from '../pages/book-store-page';
import BookDetailsPage from '../pages/book-details-page';
import ProfilePage from '../pages/profile-page';
import { ApiHelpers } from '../utils/api-helpers';
import { TestDataBuilder } from '../config/test-data';
import { loginViaUi } from '../utils/auth-flow';
import { deleteTestUser } from '../utils/test-user-cleanup';
import { recordLeakedUser } from '../utils/test-user-registry';

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
    apiTestUser: async ({ apiHelpers }, use, testInfo) => {
        const user = TestDataBuilder.createRandomUser();
        const createdUser = await apiHelpers.createUserAndGetToken(user.userName, user.password);
        const apiTestUser = {
            ...createdUser,
            password: user.password,
        };

        try {
            await use(apiTestUser);
        } finally {
            const cleanup = await deleteTestUser(apiHelpers, apiTestUser);

            if (!cleanup.ok) {
                // Teardown talks to a public demo site, so a failure here says nothing
                // about the test that just ran and must not turn it red. Surface it on
                // the report and hand the account to globalTeardown, which retries the
                // deletion once the run is over.
                testInfo.annotations.push({
                    type: 'cleanup-failed',
                    description: `${apiTestUser.userName} (${apiTestUser.userId}): ${cleanup.reason}`,
                });

                await recordLeakedUser({
                    userId: apiTestUser.userId,
                    userName: apiTestUser.userName,
                    password: apiTestUser.password,
                    reason: cleanup.reason,
                });
            }
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
