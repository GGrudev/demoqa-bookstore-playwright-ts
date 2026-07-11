import { Locator, Page } from '@playwright/test';
import { BasePage } from '../utils/base-page';

export default class RegisterPage extends BasePage {
    readonly heading: Locator;
    readonly firstNameInput: Locator;
    readonly lastNameInput: Locator;
    readonly userNameInput: Locator;
    readonly passwordInput: Locator;
    readonly registerButton: Locator;
    readonly backToLoginButton: Locator;
    readonly recaptcha: Locator;

    constructor(page: Page) {
        super(page);

        // DemoQA protects registration with reCAPTCHA, so tests cover navigation and form visibility only.
        this.heading = page.getByText('Register to Book Store');
        this.firstNameInput = page.locator('#firstname');
        this.lastNameInput = page.locator('#lastname');
        this.userNameInput = page.locator('#userName');
        this.passwordInput = page.locator('#password');
        this.registerButton = page.locator('#register');
        this.backToLoginButton = page.locator('#gotologin');
        this.recaptcha = page.locator('.recaptcha-checkbox-border');
    }

    async fillRegistrationForm(
        firstName: string,
        lastName: string,
        userName: string,
        password: string
    ) {
        await this.firstNameInput.fill(firstName);
        await this.lastNameInput.fill(lastName);
        await this.userNameInput.fill(userName);
        await this.passwordInput.fill(password);
    }

    async verifyRegisterPageElements() {
        await this.expectFieldsVisible(
            this.heading,
            this.firstNameInput,
            this.lastNameInput,
            this.userNameInput,
            this.passwordInput,
            this.registerButton,
            this.backToLoginButton
        );
    }

    async goBackToLogin() {
        await this.backToLoginButton.click();
    }
}
