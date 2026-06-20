import { Page } from '@playwright/test';
import LoginPage from '../pages/login-page';
import { removeStorageState, saveStorageState } from './auth-storage';

type UserCredentials = {
    userName: string;
    password: string;
};

export async function loginViaUi(
    page: Page,
    credentials: UserCredentials,
    storageFileName: string
): Promise<string> {
    const loginPage = new LoginPage(page);

    await loginPage.goToLogin();
    await loginPage.login(credentials.userName, credentials.password);
    await loginPage.verifyLoggedInState(credentials.userName);

    return saveStorageState(page, storageFileName);
}

export async function loginViaUiWithoutStorageState(
    page: Page,
    credentials: UserCredentials
): Promise<void> {
    const loginPage = new LoginPage(page);

    await loginPage.goToLogin();
    await loginPage.login(credentials.userName, credentials.password);
    await loginPage.verifyLoggedInState(credentials.userName);
}

export async function cleanupStorageState(storageStatePath: string): Promise<void> {
    await removeStorageState(storageStatePath);
}
