import { test, expect } from '../../../fixtures/page-fixtures';
import { TestDataBuilder } from '../../../config/test-data';

test.describe(
    'Book Store - Browse and search books',
    {
        tag: ['@e2e', '@book-store'],
    },
    () => {
        test.beforeEach(async ({ bookStorePage }) => {
            await bookStorePage.goToBookStore();
            await bookStorePage.waitForBooksLoaded();
        });

        test(
            'Verify all books are displayed in the store',
            {
                tag: ['@smoke'],
            },
            async ({ bookStorePage }) => {
                await test.step('Verify books table is visible', async () => {
                    await expect(bookStorePage.booksTable).toBeVisible();
                });

                await test.step('Verify books are listed', async () => {
                    const bookCount = await bookStorePage.getBookCount();
                    expect(bookCount).toBeGreaterThan(0);
                });
            }
        );

        test('Search for a book by title', async ({ bookStorePage }) => {
            const searchQuery = 'Git Pocket Guide';

            await test.step('Search for a specific book', async () => {
                await bookStorePage.searchForBook(searchQuery);
            });

            await test.step('Verify search results contain the book', async () => {
                await bookStorePage.verifyBookIsDisplayed(searchQuery);
                // Poll rather than snapshot: the DemoQA table filters client-side,
                // so the row list may not be settled the instant the fill resolves.
                await expect
                    .poll(() => bookStorePage.getBookTitles(), { timeout: 15000 })
                    .toContain(searchQuery);
            });
        });

        test('Search filters books correctly', async ({ bookStorePage }) => {
            const searchQuery = 'JavaScript';

            await test.step('Search for JavaScript books', async () => {
                await bookStorePage.searchForBook(searchQuery);
            });

            await test.step('Verify all displayed books contain the search term', async () => {
                await expect
                    .poll(
                        async () => {
                            const titles = await bookStorePage.getBookTitles();
                            return (
                                titles.length > 0 &&
                                titles.every((title) =>
                                    title.toLowerCase().includes(searchQuery.toLowerCase())
                                )
                            );
                        },
                        { timeout: 15000 }
                    )
                    .toBe(true);
            });
        });

        test('Clear search restores all books', async ({ bookStorePage }) => {
            await test.step('Search and then clear', async () => {
                await bookStorePage.searchForBook('Git');
                await expect
                    .poll(() => bookStorePage.getBookCount(), { timeout: 15000 })
                    .toBeGreaterThan(0);

                await bookStorePage.clearSearch();
            });

            await test.step('Verify all books are displayed again', async () => {
                await expect
                    .poll(() => bookStorePage.getBookCount(), { timeout: 15000 })
                    .toBeGreaterThanOrEqual(8);
            });
        });

        test('Click on a book navigates to book details', async ({
            bookStorePage,
            bookDetailsPage,
        }) => {
            const expectedBook = TestDataBuilder.getKnownBooks()[0];

            await test.step('Click on a book title', async () => {
                await bookStorePage.clickBookByTitle(expectedBook.title);
            });

            await test.step('Verify book details page is displayed', async () => {
                await expect(bookDetailsPage.isbnValue).toHaveText(expectedBook.isbn);
                await expect(bookDetailsPage.titleValue).toHaveText(expectedBook.title);
            });
        });

        test('Verify book details page shows correct information', async ({
            bookStorePage,
            bookDetailsPage,
        }) => {
            const expectedBook = TestDataBuilder.getKnownBooks()[0];

            await test.step('Navigate to book details', async () => {
                await bookStorePage.clickBookByTitle(expectedBook.title);
            });

            await test.step('Verify all book details', async () => {
                await bookDetailsPage.verifyBookDetails(expectedBook);
            });

            await test.step('Navigate back to book store', async () => {
                await bookDetailsPage.goBackToBookStore();
                await expect(bookStorePage.booksTable).toBeVisible();
            });
        });
    }
);
