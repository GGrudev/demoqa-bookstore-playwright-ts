import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from '../utils/base-page';

export default class BookStorePage extends BasePage {
    readonly searchBox: Locator;
    readonly booksTable: Locator;
    readonly bookRows: Locator;

    constructor(page: Page) {
        super(page);

        this.searchBox = page.locator('#searchBox');
        this.booksTable = page.locator('div.books-wrapper table');
        this.bookRows = page.locator('tbody>tr');
    }

    // The DemoQA book list is fetched asynchronously after navigation. Waiting for
    // the first row to render prevents searches from running against an empty table
    // (a race that otherwise surfaces as intermittent "0 results" failures).
    async waitForBooksLoaded() {
        await expect(this.booksTable).toBeVisible({ timeout: 20000 });
        await expect(this.booksTable.locator('tbody a').first()).toBeVisible({ timeout: 20000 });
    }

    async searchForBook(query: string) {
        await this.searchBox.fill(query);
    }

    async clearSearch() {
        await this.searchBox.clear();
    }

    async getBookTitles(): Promise<string[]> {
        const titles: string[] = [];
        const rows = await this.bookRows.all();
        for (const row of rows) {
            const titleLink = row.locator('a');
            if (await titleLink.isVisible()) {
                titles.push((await titleLink.innerText()).trim());
            }
        }
        return titles;
    }

    async clickBookByTitle(title: string) {
        const bookLink = this.page.locator('div>span>a', { hasText: title });
        await bookLink.click();
    }

    async getBookCount(): Promise<number> {
        return (await this.getBookTitles()).length;
    }

    async verifyBookIsDisplayed(title: string) {
        const bookLink = this.page.locator('div>span>a', { hasText: title });
        await expect(bookLink).toBeVisible();
    }

    async verifyBookIsNotDisplayed(title: string) {
        const bookLink = this.page.locator('div>span>a', { hasText: title });
        await expect(bookLink).toBeHidden();
    }
}
