import { test as baseTest } from '@playwright/test';
import LoginPage from '../pages/login-page';
import RegisterPage from '../pages/register-page';
import BookStorePage from '../pages/book-store-page';
import BookDetailsPage from '../pages/book-details-page';
import ProfilePage from '../pages/profile-page';
import { ApiHelpers } from '../utils/api-helpers';
import { TestDataBuilder } from '../config/test-data';
import { cleanupStorageState, loginViaUi } from '../utils/auth-flow';

type ApiTestUser = {
    userId: string;
    userName: string;
    password: string;
    token: string;
};

type LoggedInUser = {
    userName: string;
    password: string;
    storageStatePath: string;
};

type LoggedInApiUser = ApiTestUser & {
    storageStatePath: string;
};

type Pages = {
    loginPage: LoginPage;
    registerPage: RegisterPage;
    bookStorePage: BookStorePage;
    bookDetailsPage: BookDetailsPage;
    profilePage: ProfilePage;
    apiHelpers: ApiHelpers;
    apiTestUser: ApiTestUser;
    loggedInUser: LoggedInUser;
    loggedInApiUser: LoggedInApiUser;
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
            await apiHelpers.deleteUser(apiTestUser.userId, apiTestUser.token);
        }
    },
    loggedInUser: async ({ page }, use, workerInfo) => {
        const validUser = TestDataBuilder.createValidUser();
        const storageFileName = `valid-user-w${workerInfo.workerIndex}.json`;
        const storageStatePath = await loginViaUi(page, validUser, storageFileName);
        const loggedInUser = {
            userName: validUser.userName,
            password: validUser.password,
            storageStatePath,
        };

        try {
            await use(loggedInUser);
        } finally {
            await cleanupStorageState(storageStatePath);
        }
    },
    loggedInApiUser: async ({ page, apiTestUser }, use) => {
        const storageFileName = `api-user-${apiTestUser.userId}.json`;
        const storageStatePath = await loginViaUi(page, apiTestUser, storageFileName);
        const loggedInApiUser = {
            ...apiTestUser,
            storageStatePath,
        };

        try {
            await use(loggedInApiUser);
        } finally {
            await cleanupStorageState(storageStatePath);
        }
    },
});

export const test = testPages;
export const expect = testPages.expect;

export type { ApiTestUser, LoggedInApiUser, LoggedInUser };
