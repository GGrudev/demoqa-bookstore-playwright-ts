import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from '../utils/base-page';
import { BooksTable } from '../components/books-table';
import { ConfirmDialog } from '../components/confirm-dialog';
import { getTimeouts } from '../config/environments';

const timeouts = getTimeouts();

export default class ProfilePage extends BasePage {
    readonly books: BooksTable;
    readonly confirmDialog: ConfirmDialog;
    readonly deleteAccountButton: Locator;
    readonly deleteAllBooksButton: Locator;
    readonly goToBookStoreButton: Locator;

    constructor(page: Page) {
        super(page);

        this.books = new BooksTable(page);
        this.confirmDialog = new ConfirmDialog(page);
        this.deleteAccountButton = page.getByRole('button', { name: 'Delete Account' });
        this.deleteAllBooksButton = page.getByRole('button', { name: 'Delete All Books' });
        this.goToBookStoreButton = page.locator('#gotoStore');
    }

    get booksTable() {
        return this.books.root;
    }

    async getBookTitlesInProfile(): Promise<string[]> {
        return this.books.getTitles();
    }

    async deleteAllBooks() {
        await this.deleteAllBooksButton.scrollIntoViewIfNeeded();
        await this.deleteAllBooksButton.click();
        const dialog = this.page.getByRole('dialog', { name: 'Delete All Books' });
        await this.confirmDialog.confirmWithOptionalAlert(
            dialog.getByRole('button', { name: 'OK' }),
            false
        );
        await this.verifyNoBooksInProfile();
    }

    async navigateToBookStore() {
        await this.goToBookStoreButton.scrollIntoViewIfNeeded();
        await this.goToBookStoreButton.click();
    }

    async verifyBookInProfile(title: string) {
        await expect(this.page.getByRole('link', { name: title })).toBeVisible();
    }

    async verifyNoBooksInProfile() {
        await expect
            .poll(async () => (await this.getBookTitlesInProfile()).length, {
                timeout: timeouts.uiSettle,
            })
            .toBe(0);
    }

    async expectProfileControlsVisible() {
        await expect(this.deleteAccountButton).toBeVisible();
        await expect(this.deleteAllBooksButton).toBeVisible();
        await expect(this.goToBookStoreButton).toBeVisible();
    }

    async deleteBookByIsbn(isbn: string) {
        const row = this.books.rowByIsbn(isbn);
        await expect(row).toBeVisible();
        // DemoQA renders the delete control as an unlabeled image inside the last cell.
        await row.locator('td').last().getByRole('img').click();
        await this.confirmDialog.confirmDeleteBook();
        await expect(row).toBeHidden();
    }
}
