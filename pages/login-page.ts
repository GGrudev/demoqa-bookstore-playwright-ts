import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from '../utils/base-page';

export default class LoginPage extends BasePage {
    readonly heading: Locator;
    readonly welcomeText: Locator;
    readonly userNameInput: Locator;
    readonly passwordInput: Locator;
    readonly loginButton: Locator;
    readonly newUserButton: Locator;
    readonly userNameLabel: Locator;
    readonly passwordLabel: Locator;
    readonly invalidCredentialsMessage: Locator;

    constructor(page: Page) {
        super(page);

        this.heading = page.getByRole('heading', { name: 'Login in Book Store' });
        this.welcomeText = page.getByRole('heading');
        this.userNameInput = page.locator('#userName');
        this.passwordInput = page.locator('#password');
        this.loginButton = page.locator('#login');
        this.newUserButton = page.locator('#newUser');
        this.userNameLabel = page.locator('#userName-label');
        this.passwordLabel = page.locator('#password-label');
        this.invalidCredentialsMessage = page.locator('#name');
    }

    async login(userName: string, password: string) {
        await this.userNameInput.fill(userName);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
    }

    async verifyLoginPageElements() {
        await this.expectFieldsVisible(
            this.heading,
            this.userNameInput,
            this.passwordInput,
            this.loginButton,
            this.newUserButton
        );
    }

    async verifyInvalidLoginMessage() {
        await expect(this.invalidCredentialsMessage).toHaveText('Invalid username or password!');
    }

    async goToRegister() {
        await this.newUserButton.click();
    }
}
