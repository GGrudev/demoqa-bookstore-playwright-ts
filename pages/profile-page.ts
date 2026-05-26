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

    constructor(public page: Page) {
        super(page);

        this.userNameValue = page.locator('#userName-value');
        this.booksTable = page.locator('div.books-wrapper table');
        this.bookRows = page.locator('tbody>tr');
        this.deleteAccountButton = page.getByRole('button', { name: 'Delete Account' });
        this.deleteAllBooksButton = page.getByRole('button', { name: 'Delete All Books' });
        this.goToBookStoreButton = page.locator('#gotoStore');
        this.logoutButton = page.locator('#submit').filter({ hasText: 'Logout' });
        this.searchBox = page.locator('#searchBox');
        this.noRowsFound = page.getByText('No rows found');
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

    async deleteAllBooks() {
        await this.click(this.deleteAllBooksButton);
        await this.click(this.dialogOkButton);
    }

    async deleteAccount() {
        await this.click(this.deleteAccountButton);
        await this.click(this.dialogOkButton);
    }

    async navigateToBookStore() {
        await this.click(this.goToBookStoreButton);
    }

    async logout() {
        await this.click(this.logoutButton);
    }

    async verifyBookInProfile(title: string) {
        const bookLink = this.page.getByRole('link', { name: title });
        await expect(bookLink).toBeVisible();
    }

    async verifyNoBooksInProfile() {
        await expect(this.noRowsFound).toBeVisible();
    }

    async deleteBookByTitle(title: string) {
        const row = this.page.locator('.rt-tr-group').filter({
            has: this.page.locator('a', { hasText: title }),
        });
        const deleteIcon = row.locator('#delete-record-undefined');
        await this.click(deleteIcon);
        await this.click(this.dialogOkButton);
    }
}
