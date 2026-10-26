import { Locator, Page, Response, expect } from '@playwright/test';
import { BasePage } from '@utils/base-page';
import { BooksTable } from '@components/books-table';
import { ConfirmDialog } from '@components/confirm-dialog';
import { getTimeouts } from '@config/environments';

const timeouts = getTimeouts();

export default class ProfilePage extends BasePage {
    readonly books: BooksTable;
    readonly confirmDialog: ConfirmDialog;
    readonly deleteAccountButton: Locator;
    readonly deleteAllBooksButton: Locator;
    readonly goToBookStoreButton: Locator;

    constructor(page: Page) {
        super(page);

        this.books = new BooksTable(page, 'div.profile-wrapper table');
        this.confirmDialog = new ConfirmDialog(page);
        this.deleteAccountButton = page.getByRole('button', { name: 'Delete Account' });
        this.deleteAllBooksButton = page.getByRole('button', { name: 'Delete All Books' });
        this.goToBookStoreButton = page.locator('#gotoStore');
    }

    get booksTable() {
        return this.books.table;
    }

    async getBookTitlesInProfile(): Promise<string[]> {
        return this.books.getTitles();
    }

    // Clicks "Delete All Books", confirms, and returns the DELETE response. Callers assert
    // the status and the resulting page state. DemoQA clears the collection on the server
    // but does not re-render the table, so callers must reload before checking the table.
    async deleteAllBooks(): Promise<Response> {
        await this.deleteAllBooksButton.scrollIntoViewIfNeeded();
        await this.deleteAllBooksButton.click();
        const dialog = this.page.getByRole('dialog', { name: 'Delete All Books' });

        // Start listening before confirming so a fast response is not missed. Promise.all
        // also handles the listener if the confirm step throws, so it cannot reject unhandled.
        const [deleteResponse] = await Promise.all([
            this.page.waitForResponse(
                (response) =>
                    response.request().method() === 'DELETE' &&
                    new URL(response.url()).pathname === '/BookStore/v1/Books',
                { timeout: timeouts.uiSettle }
            ),
            this.confirmDialog.confirmWithOptionalAlert(
                dialog.getByRole('button', { name: 'OK' }),
                false
            ),
        ]);

        return deleteResponse;
    }

    async navigateToBookStore() {
        await this.goToBookStoreButton.scrollIntoViewIfNeeded();
        await this.goToBookStoreButton.click();
    }

    async verifyBookInProfile(title: string) {
        await expect(this.page.getByRole('link', { name: title })).toBeVisible();
    }

    async verifyNoBooksInProfile() {
        // Table must be visible; a missed locator would also report 0 rows.
        await expect(this.booksTable).toBeVisible();
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
        await this.books.deleteControl(row).click();
        await this.confirmDialog.confirmDeleteBook();
        await expect(row).toBeHidden();
    }
}
