import { Page, expect } from '@playwright/test';
import LoginPage from '@pages/login-page';
import { UserCredentials } from '@config/test-data';

// UI login for a per-test user. Does not write storageState.
export async function loginViaUi(page: Page, credentials: UserCredentials): Promise<void> {
    const loginPage = new LoginPage(page);

    await loginPage.goToLogin();
    await loginPage.login(credentials.userName, credentials.password);
    await expect(page).toHaveURL(/\/profile$/);
    await loginPage.header.expectLoggedIn(credentials.userName);
}
