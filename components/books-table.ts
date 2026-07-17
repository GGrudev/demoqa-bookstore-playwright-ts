import { Locator, Page, expect } from '@playwright/test';

// Shared books table + search UI used on Book Store and Profile.
// Extracted so row/title/search behavior lives in one place (composition over copy-paste).
export class BooksTable {
    readonly root: Locator;
    readonly searchBox: Locator;
    readonly rows: Locator;

    constructor(private readonly page: Page) {
        this.root = page.locator('div.books-wrapper table');
        this.searchBox = page.locator('#searchBox');
        this.rows = this.root.locator('tbody > tr');
    }

    // The DemoQA book list is fetched asynchronously after navigation. Waiting for
    // the first row to render prevents searches from running against an empty table
    // (a race that otherwise surfaces as intermittent "0 results" failures).
    async waitForLoaded() {
        await expect(this.root).toBeVisible({ timeout: 20000 });
        await expect(this.root.locator('tbody a').first()).toBeVisible({ timeout: 20000 });
    }

    async expectVisible() {
        await expect(this.root).toBeVisible();
    }

    async search(query: string) {
        await this.searchBox.fill(query);
    }

    async clearSearch() {
        await this.searchBox.clear();
    }

    async getTitles(): Promise<string[]> {
        const titles: string[] = [];
        const titleLinks = this.root.locator('tbody a');

        for (const link of await titleLinks.all()) {
            if (await link.isVisible()) {
                titles.push((await link.innerText()).trim());
            }
        }

        return titles;
    }

    async getCount(): Promise<number> {
        return (await this.getTitles()).length;
    }

    titleLink(title: string): Locator {
        return this.page.locator('div>span>a', { hasText: title });
    }

    async expectTitleVisible(title: string) {
        await expect(this.titleLink(title)).toBeVisible();
    }

    async expectTitleHidden(title: string) {
        await expect(this.titleLink(title)).toBeHidden();
    }

    rowByIsbn(isbn: string): Locator {
        return this.root.locator(`tbody > tr:has(a[href*="${isbn}"])`);
    }

    rowByTitle(title: string): Locator {
        return this.page.getByRole('row', { name: new RegExp(title) });
    }
}
