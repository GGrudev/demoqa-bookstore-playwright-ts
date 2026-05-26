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

    constructor(public page: Page) {
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
        await this.enterText(this.firstNameInput, firstName);
        await this.enterText(this.lastNameInput, lastName);
        await this.enterText(this.userNameInput, userName);
        await this.enterText(this.passwordInput, password);
    }

    async verifyRegisterPageElements() {
        await this.verifyFieldsVisibility(
            true,
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
        await this.click(this.backToLoginButton);
    }
}
