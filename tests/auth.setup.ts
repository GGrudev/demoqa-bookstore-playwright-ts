import { test as setup } from '@playwright/test';
import LoginPage from '../pages/login-page';
import { TestDataBuilder } from '../config/test-data';
import { STATIC_USER_STORAGE_STATE, ensureAuthDir } from '../utils/auth-storage';

// Authenticates the shared static user once and persists the session so the
// `authenticated` project can reuse it via `storageState` without logging in per test.
// Tagged @e2e so it is not filtered out when the suite is selected with `--grep @e2e`.
setup('authenticate static user', { tag: '@e2e' }, async ({ page }) => {
    const user = TestDataBuilder.createValidUser();
    const loginPage = new LoginPage(page);

    await loginPage.goToLogin();
    await loginPage.login(user.userName, user.password);
    await loginPage.header.expectLoggedIn(user.userName);

    await ensureAuthDir();
    await page.context().storageState({ path: STATIC_USER_STORAGE_STATE });
});
