import { test, expect } from '../../../fixtures/page-fixtures';
import { TestDataBuilder } from '../../../config/test-data';
import { loginViaUi } from '../../../utils/auth-flow';

test.describe(
    'Profile - Collection management',
    {
        tag: ['@e2e', '@profile'],
    },
    () => {
        test('Add book to collection from book details page', async ({
            loggedInApiUser,
            bookStorePage,
            bookDetailsPage,
            profilePage,
        }) => {
            const bookToAdd = TestDataBuilder.getKnownBooks()[0];

            await test.step('Open book details while logged in', async () => {
                await bookStorePage.goToBookStore();
                await bookStorePage.clickBookByTitle(bookToAdd.title);
                await bookDetailsPage.verifyLoggedInOnDetailsPage(loggedInApiUser.userName);
            });

            await test.step('Add the book to the user collection', async () => {
                await bookDetailsPage.addToCollection();
            });

            await test.step('Verify the book appears in profile', async () => {
                await profilePage.goToProfile();
                await profilePage.verifyLoggedInProfile(loggedInApiUser.userName);
                await profilePage.verifyBookInProfile(bookToAdd.title);
            });
        });

        test('Delete single book from profile', async ({
            apiTestUser,
            apiHelpers,
            page,
            profilePage,
        }) => {
            const bookToDelete = TestDataBuilder.getKnownBooks()[0];

            await test.step('Prepare user collection through API', async () => {
                const response = await apiHelpers.addBooksToUser(
                    apiTestUser.userId,
                    apiTestUser.token,
                    [bookToDelete.isbn]
                );

                expect(response.status).toBe(201);
            });

            await test.step('Login through UI after API setup', async () => {
                await loginViaUi(page, apiTestUser);
            });

            await test.step('Delete the book from profile', async () => {
                await profilePage.goToProfile();
                await profilePage.verifyLoggedInProfile(apiTestUser.userName);
                await profilePage.verifyBookInProfile(bookToDelete.title);
                await profilePage.deleteBookByIsbn(bookToDelete.isbn);
            });

            await test.step('Verify the profile collection is empty', async () => {
                await profilePage.verifyNoBooksInProfile();
            });
        });

        test('Delete all books from profile', async ({
            apiTestUser,
            apiHelpers,
            page,
            profilePage,
        }) => {
            test.setTimeout(60000);
            const booksToAdd = TestDataBuilder.getKnownBooks().slice(0, 2);

            await test.step('Prepare user collection through API', async () => {
                const response = await apiHelpers.addBooksToUser(
                    apiTestUser.userId,
                    apiTestUser.token,
                    booksToAdd.map((book) => book.isbn)
                );

                expect(response.status).toBe(201);
            });

            await test.step('Login through UI after API setup', async () => {
                await loginViaUi(page, apiTestUser);
            });

            await test.step('Delete all books from profile', async () => {
                await profilePage.goToProfile();
                await profilePage.verifyLoggedInProfile(apiTestUser.userName);

                for (const book of booksToAdd) {
                    await profilePage.verifyBookInProfile(book.title);
                }

                await profilePage.deleteAllBooks();
            });

            await test.step('Verify the profile collection is empty', async () => {
                await profilePage.verifyNoBooksInProfile();
            });
        });
    }
);
