import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from '../utils/base-page';

export default class BookStorePage extends BasePage {
    readonly searchBox: Locator;
    readonly booksTable: Locator;
    readonly bookRows: Locator;
    readonly loginButton: Locator;
    readonly logoutButton: Locator;
    readonly userNameValue: Locator;

    constructor(page: Page) {
        super(page);

        this.searchBox = page.locator('#searchBox');
        this.booksTable = page.locator('div.books-wrapper table');
        this.bookRows = page.locator('tbody>tr'); //.filter({ has: page.locator('a') });
        this.loginButton = page.locator('#login');
        this.logoutButton = page.locator('#submit').filter({ hasText: 'Log out' });
        this.userNameValue = page.locator('#userName-value');
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

    async verifyLoggedInState(expectedUserName: string) {
        await expect(this.userNameValue).toHaveText(expectedUserName);
        await expect(this.logoutButton).toBeVisible();
    }
}
