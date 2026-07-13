import { Locator, Page, expect } from '@playwright/test';
import { Header } from '../components/header';

// Minimal shared base for page objects: shared navigation, a composed Header
// component for session state, and a small assertion helper. Interactions use
// Playwright locators directly in the page objects, relying on built-in auto-waiting.
export class BasePage {
    readonly header: Header;

    constructor(public readonly page: Page) {
        this.header = new Header(page);
    }

    async goToLogin() {
        await this.page.goto('/login');
    }

    async goToBookStore() {
        await this.page.goto('/books');
    }

    async goToProfile() {
        await this.page.goto('/profile');
    }

    async expectFieldsVisible(...fields: Locator[]) {
        await Promise.all(fields.map((field) => expect(field).toBeVisible()));
    }
}
