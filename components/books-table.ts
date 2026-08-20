import { Locator, Page, expect } from '@playwright/test';
import { getTimeouts } from '@config/environments';

const timeouts = getTimeouts();

export class BooksTable {
    readonly root: Locator;
    readonly searchBox: Locator;
    readonly rows: Locator;

    // Book Store uses books-wrapper; Profile uses profile-wrapper. Wrong wrapper
    // matches nothing, so "0 books" assertions pass without checking the table.
    constructor(
        private readonly page: Page,
        rootSelector: string = 'div.books-wrapper table'
    ) {
        this.root = page.locator(rootSelector);
        this.searchBox = page.locator('#searchBox');
        this.rows = this.root.locator('tbody > tr');
    }

    // Book list is fetched after navigation; searching before the first row appears
    // looks like "0 results".
    async waitForLoaded() {
        await expect(this.root).toBeVisible({ timeout: timeouts.asyncList });
        await expect(this.root.locator('tbody a').first()).toBeVisible({
            timeout: timeouts.asyncList,
        });
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
        const titles = await this.root.locator('tbody a:visible').allInnerTexts();

        return titles.map((title) => title.trim());
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
