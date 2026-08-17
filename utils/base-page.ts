import { Locator, Page, expect } from '@playwright/test';
import { Header } from '../components/header';

// Minimal shared base for page objects: shared navigation, a composed Header
// component for session state, and a small assertion helper. Interactions use
// Playwright locators directly in the page objects, relying on built-in auto-waiting.
// Selector priority for new locators: getByRole/getByLabel → getByText → stable #id → CSS.
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

    // Soft assertions are used here so a broken page reports every missing field at
    // once instead of only the first. They also never reject, which means the parallel
    // check cannot leave the losers of a `Promise.all` race as unhandled rejections.
    // Playwright still fails the test once the soft failures are collected.
    async expectFieldsVisible(...fields: Locator[]) {
        await Promise.all(fields.map((field) => expect.soft(field).toBeVisible()));
    }
}
