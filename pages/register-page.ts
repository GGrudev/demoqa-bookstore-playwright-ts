import { Locator, Page } from '@playwright/test';
import { BasePage } from '@utils/base-page';

export default class RegisterPage extends BasePage {
    readonly heading: Locator;
    readonly firstNameInput: Locator;
    readonly lastNameInput: Locator;
    readonly userNameInput: Locator;
    readonly passwordInput: Locator;
    readonly registerButton: Locator;
    readonly backToLoginButton: Locator;

    constructor(page: Page) {
        super(page);

        // reCAPTCHA blocks submit; this page object only covers the form itself.
        this.heading = page.getByText('Register to Book Store');
        this.firstNameInput = page.locator('#firstname');
        this.lastNameInput = page.locator('#lastname');
        this.userNameInput = page.locator('#userName');
        this.passwordInput = page.locator('#password');
        this.registerButton = page.locator('#register');
        this.backToLoginButton = page.locator('#gotologin');
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
}
