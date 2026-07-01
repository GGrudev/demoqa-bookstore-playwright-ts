import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from '../utils/base-page';
import { BookData } from '../config/test-data';

export default class BookDetailsPage extends BasePage {
    readonly isbnValue: Locator;
    readonly titleValue: Locator;
    readonly subTitleValue: Locator;
    readonly authorValue: Locator;
    readonly publisherValue: Locator;
    readonly totalPagesValue: Locator;
    readonly descriptionValue: Locator;
    readonly websiteValue: Locator;
    readonly backToBookStoreButton: Locator;
    readonly addToCollectionButton: Locator;
    readonly loginButton: Locator;
    readonly logoutButton: Locator;

    constructor(public page: Page) {
        super(page);

        this.isbnValue = page.locator('div#ISBN-wrapper #userName-value');
        this.titleValue = page.locator('#title-wrapper #userName-value');
        this.subTitleValue = page.locator('#subtitle-wrapper #userName-value');
        this.authorValue = page.locator('#author-wrapper #userName-value');
        this.publisherValue = page.locator('#publisher-wrapper #userName-value');
        this.totalPagesValue = page.locator('#pages-wrapper #userName-value');
        this.descriptionValue = page.locator('#description-wrapper #userName-value');
        this.websiteValue = page.locator('#website-wrapper #userName-value');
        this.backToBookStoreButton = page.locator('#addNewRecordButton', {
            hasText: 'Back To Book Store',
        });
        this.addToCollectionButton = page.locator('#addNewRecordButton', {
            hasText: 'Add To Your Collection',
        });
        this.loginButton = page.locator('#login');
        this.logoutButton = page.locator('#submit').filter({ hasText: 'Log out' });
    }

    async verifyBookDetails(expectedBook: BookData) {
        await expect(this.isbnValue).toHaveText(expectedBook.isbn);
        await expect(this.titleValue).toHaveText(expectedBook.title);
        await expect(this.subTitleValue).toHaveText(expectedBook.subTitle);
        await expect(this.authorValue).toHaveText(expectedBook.author);
        await expect(this.publisherValue).toHaveText(expectedBook.publisher);
        await expect(this.totalPagesValue).toHaveText(expectedBook.totalPages.toString());
    }

    async getDisplayedIsbn(): Promise<string> {
        return await this.getText(this.isbnValue);
    }

    async getDisplayedTitle(): Promise<string> {
        return await this.getText(this.titleValue);
    }

    async addToCollection() {
        await this.click(this.addToCollectionButton);
    }

    async verifyLoggedInOnDetailsPage(expectedUserName: string) {
        await expect(this.page.locator('#userName-value').first()).toHaveText(expectedUserName);
        await expect(this.logoutButton).toBeVisible();
    }

    async goBackToBookStore() {
        await this.click(this.backToBookStoreButton);
    }
}
