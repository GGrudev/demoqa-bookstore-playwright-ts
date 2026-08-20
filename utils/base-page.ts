import { Locator, Page, expect } from '@playwright/test';
import { Header } from '@components/header';

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

    // Soft so every missing field is reported. Hard expects inside Promise.all can
    // leave unhandled rejections when the first one fails.
    async expectFieldsVisible(...fields: Locator[]) {
        await Promise.all(fields.map((field) => expect.soft(field).toBeVisible()));
    }
}
