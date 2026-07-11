import { Locator, Page, expect } from '@playwright/test';

// Minimal shared base for page objects: only navigation shared by every page and
// a small assertion helper. Interactions use Playwright locators directly in the
// page objects, relying on built-in auto-waiting instead of custom wrappers.
export class BasePage {
    constructor(public readonly page: Page) {}

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
