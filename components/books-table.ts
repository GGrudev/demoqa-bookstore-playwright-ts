import { Locator, Page, expect } from '@playwright/test';
import { getTimeouts } from '@config/environments';

const timeouts = getTimeouts();

// Shared books table + search UI used on Book Store and Profile.
// Extracted so row/title/search behavior lives in one place (composition over copy-paste).
export class BooksTable {
    readonly root: Locator;
    readonly searchBox: Locator;
    readonly rows: Locator;

    // Book Store and Profile render the same table under different wrappers
    // (`books-wrapper` vs `profile-wrapper`), so the owning page object supplies its
    // own. Defaulting to a wrapper that does not exist on the page silently yields an
    // empty table, which makes "no books" assertions pass without checking anything.
    constructor(
        private readonly page: Page,
        rootSelector: string = 'div.books-wrapper table'
    ) {
        this.root = page.locator(rootSelector);
        this.searchBox = page.locator('#searchBox');
        this.rows = this.root.locator('tbody > tr');
    }

    // The DemoQA book list is fetched asynchronously after navigation. Waiting for
    // the first row to render prevents searches from running against an empty table
    // (a race that otherwise surfaces as intermittent "0 results" failures).
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

    // One round trip rather than two per row: this runs on every iteration of the
    // `expect.poll` loops that wait for the client-side filter to settle, so a
    // per-row visibility check makes the polls markedly slower on a full table.
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
