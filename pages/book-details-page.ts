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

    constructor(page: Page) {
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
        return (await this.isbnValue.innerText()).trim();
    }

    async getDisplayedTitle(): Promise<string> {
        return (await this.titleValue.innerText()).trim();
    }

    async addToCollection() {
        const dialogHandled = this.page.waitForEvent('dialog').then(async (dialog) => {
            expect(dialog.message()).toContain('Book added to your collection.');
            await dialog.accept();
        });

        await this.addToCollectionButton.click();
        await dialogHandled;
    }

    async goBackToBookStore() {
        await this.backToBookStoreButton.click();
    }
}
