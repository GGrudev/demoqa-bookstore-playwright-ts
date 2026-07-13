import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from '../utils/base-page';

export default class ProfilePage extends BasePage {
    readonly userNameValue: Locator;
    readonly booksTable: Locator;
    readonly bookRows: Locator;
    readonly deleteAccountButton: Locator;
    readonly deleteAllBooksButton: Locator;
    readonly goToBookStoreButton: Locator;
    readonly logoutButton: Locator;
    readonly searchBox: Locator;
    readonly noRowsFound: Locator;
    readonly notLoggedInMessage: Locator;
    readonly dialogContainer: Locator;
    readonly dialogOkButton: Locator;
    readonly dialogCancelButton: Locator;

    constructor(page: Page) {
        super(page);

        this.userNameValue = page.locator('#userName-value');
        this.booksTable = page.locator('div.books-wrapper table');
        this.bookRows = this.booksTable.locator('tbody > tr');
        this.deleteAccountButton = page.getByRole('button', { name: 'Delete Account' });
        this.deleteAllBooksButton = page.getByRole('button', { name: 'Delete All Books' });
        this.goToBookStoreButton = page.locator('#gotoStore');
        this.logoutButton = page.locator('#submit').filter({ hasText: /Log\s?out/i });
        this.searchBox = page.locator('#searchBox');
        this.noRowsFound = page.locator('.rt-noData');
        this.notLoggedInMessage = page.getByText(
            'Currently you are not logged into the Book Store application'
        );
        this.dialogContainer = page.locator('.modal-content');
        this.dialogOkButton = page.locator('#closeSmallModal-ok');
        this.dialogCancelButton = page.locator('#closeSmallModal-cancel');
    }

    async verifyNotLoggedIn() {
        await expect(this.notLoggedInMessage).toBeVisible();
    }

    async verifyLoggedInProfile(expectedUserName: string) {
        await expect(this.userNameValue).toHaveText(expectedUserName);
        await expect(this.logoutButton).toBeVisible();
    }

    async getBookTitlesInProfile(): Promise<string[]> {
        const titleLinks = this.booksTable.locator('tbody a');
        const titles: string[] = [];

        for (const link of await titleLinks.all()) {
            if (await link.isVisible()) {
                titles.push((await link.innerText()).trim());
            }
        }

        return titles;
    }

    async deleteAllBooks() {
        await this.deleteAllBooksButton.scrollIntoViewIfNeeded();
        await this.deleteAllBooksButton.click();
        const dialog = this.page.getByRole('dialog', { name: 'Delete All Books' });
        await this.confirmWithOptionalAlert(dialog.getByRole('button', { name: 'OK' }), false);
        await this.verifyNoBooksInProfile();
    }

    async deleteAccount() {
        await this.deleteAccountButton.click();
        const dialog = this.page.getByRole('dialog');
        await this.confirmBootstrapDialog(dialog.getByRole('button', { name: 'OK' }));
    }

    async navigateToBookStore() {
        await this.goToBookStoreButton.click();
    }

    async logout() {
        await this.logoutButton.click();
    }

    async verifyBookInProfile(title: string) {
        const bookLink = this.page.getByRole('link', { name: title });
        await expect(bookLink).toBeVisible();
    }

    async verifyNoBooksInProfile() {
        await expect.poll(async () => (await this.getBookTitlesInProfile()).length).toBe(0);
    }

    async deleteBookByIsbn(isbn: string) {
        const row = this.page.locator(`tbody > tr:has(a[href*="${isbn}"])`);
        await expect(row).toBeVisible();
        await row.locator('td').last().getByRole('img').click();
        await this.confirmDeleteBookDialog();
        await expect(row).toBeHidden();
    }

    async deleteBookByTitle(title: string) {
        const row = this.page.getByRole('row', { name: new RegExp(title) });
        await expect(row).toBeVisible();
        await row.locator('td').last().getByRole('img').click();
        await this.confirmDeleteBookDialog();
        await expect(this.page.getByRole('link', { name: title })).toBeHidden();
    }

    private async confirmDeleteBookDialog() {
        await this.confirmWithOptionalAlert(this.page.locator('#closeSmallModal-ok'));
    }

    private async confirmBootstrapDialog(confirmButton: Locator) {
        await expect(confirmButton).toBeVisible();
        await confirmButton.click();
        await expect(confirmButton).toBeHidden({ timeout: 15000 });
    }

    private async confirmWithOptionalAlert(confirmButton: Locator, waitToClose = true) {
        await expect(confirmButton).toBeVisible({ timeout: 10000 });
        const alertPromise = this.page.waitForEvent('dialog', { timeout: 5000 }).catch(() => null);
        await confirmButton.evaluate((button) => (button as HTMLButtonElement).click());
        const nativeDialog = await alertPromise;
        if (nativeDialog) {
            await nativeDialog.accept();
        }
        if (waitToClose) {
            await expect(confirmButton).toBeHidden({ timeout: 15000 });
        }
    }
}
