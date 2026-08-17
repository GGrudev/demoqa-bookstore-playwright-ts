import { Page, expect } from '@playwright/test';
import { BasePage } from '@utils/base-page';
import { BooksTable } from '@components/books-table';

export default class BookStorePage extends BasePage {
    readonly books: BooksTable;

    constructor(page: Page) {
        super(page);
        this.books = new BooksTable(page);
    }

    /** Root table locator — kept for tests that assert table visibility. */
    get booksTable() {
        return this.books.root;
    }

    async waitForBooksLoaded() {
        await this.books.waitForLoaded();
    }

    async expectBooksTableVisible() {
        await this.books.expectVisible();
    }

    async searchForBook(query: string) {
        await this.books.search(query);
    }

    async clearSearch() {
        await this.books.clearSearch();
    }

    async getBookTitles(): Promise<string[]> {
        return this.books.getTitles();
    }

    async getBookCount(): Promise<number> {
        return this.books.getCount();
    }

    async clickBookByTitle(title: string) {
        await this.books.titleLink(title).click();
    }

    async verifyBookIsDisplayed(title: string) {
        await this.books.expectTitleVisible(title);
    }

    async verifyBookIsNotDisplayed(title: string) {
        await this.books.expectTitleHidden(title);
    }

    async expectBookDetailsUrl(isbn: string) {
        await expect(this.page).toHaveURL((url) => url.searchParams.get('search') === isbn);
    }
}
