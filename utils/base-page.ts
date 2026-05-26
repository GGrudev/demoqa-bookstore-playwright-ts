import { Locator, Page, expect } from '@playwright/test';
import { Waits } from './waits';

export class BasePage extends Waits {
    readonly loginLink: Locator;
    readonly bookStoreLink: Locator;
    readonly profileLink: Locator;

    constructor(public page: Page) {
        super(page);

        this.loginLink = page.getByText('Login', { exact: true }).first();
        this.bookStoreLink = page.getByText('Book Store', { exact: true }).first();
        this.profileLink = page.getByText('Profile', { exact: true }).first();
    }

    async navigateTo(url: string) {
        await this.page.goto(url);
    }

    async refreshPage() {
        await this.page.reload();
    }

    async click(element: Locator) {
        await element.waitFor({ state: 'visible' });
        await element.click();
    }

    async doubleClick(element: Locator): Promise<void> {
        await element.waitFor({ state: 'visible' });
        await element.dblclick();
    }

    async hoverAndClick(element: Locator) {
        await element.hover();
        await this.click(element);
    }

    async enterText(element: Locator, text: string) {
        await this.waitElementToBeVisible(element);
        await element.click();
        await element.fill(text);
    }

    async getText(element: Locator): Promise<string> {
        await this.waitElementToBeVisible(element);
        return (await element.innerText()).trim();
    }

    async getInputValue(element: Locator): Promise<string> {
        await this.waitElementToBeVisible(element);
        return await element.inputValue();
    }

    async expectElementToBeVisible(element: Locator) {
        await expect(element).toBeVisible();
    }

    async expectElementToContainText(element: Locator, text: string) {
        await expect(element).toContainText(text);
    }

    async expectElementToHaveText(element: Locator, text: string) {
        await expect(element).toHaveText(text);
    }

    async verifyFieldsVisibility(shouldBeVisible: boolean = true, ...fields: Locator[]) {
        const expectations = fields.map((field) =>
            shouldBeVisible ? expect(field).toBeVisible() : expect(field).toBeHidden()
        );
        await Promise.all(expectations);
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
}
