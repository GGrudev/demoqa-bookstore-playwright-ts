import { Page } from '@playwright/test';
import LoginPage from '../pages/login-page';

type UserCredentials = {
    userName: string;
    password: string;
};

// Logs in through the UI without persisting storage state. Used for hybrid tests
// that create an isolated API user per test, where a shared session cannot be reused.
export async function loginViaUi(page: Page, credentials: UserCredentials): Promise<void> {
    const loginPage = new LoginPage(page);

    await loginPage.goToLogin();
    await loginPage.login(credentials.userName, credentials.password);
    await loginPage.header.expectLoggedIn(credentials.userName);
}
