import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from '../utils/base-page';

export default class LoginPage extends BasePage {
    readonly heading: Locator;
    readonly userNameInput: Locator;
    readonly passwordInput: Locator;
    readonly loginButton: Locator;
    readonly newUserButton: Locator;
    readonly invalidCredentialsMessage: Locator;

    constructor(page: Page) {
        super(page);

        this.heading = page.getByRole('heading', { name: 'Login in Book Store' });
        this.userNameInput = page.locator('#userName');
        this.passwordInput = page.locator('#password');
        this.loginButton = page.locator('#login');
        this.newUserButton = page.locator('#newUser');
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

    async verifyRequiredFieldValidation() {
        // DemoQA exposes required-field state through Bootstrap's validation class
        // but does not render an accessible validation message for these inputs.
        await expect(this.userNameInput).toHaveClass(/is-invalid/);
        await expect(this.passwordInput).toHaveClass(/is-invalid/);
    }

    async verifyEmptyCredentialsRejected() {
        await this.loginButton.click();
        await this.verifyRequiredFieldValidation();
    }

    async expectOnLoginPage() {
        await expect(this.page).toHaveURL(/\/login$/);
        await expect(this.loginButton).toBeVisible();
    }

    async goToRegister() {
        await this.newUserButton.click();
    }
}
