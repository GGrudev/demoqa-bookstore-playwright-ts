import { test, expect } from '../../../fixtures/page-fixtures';
import { TestDataBuilder } from '../../../config/test-data';

test.describe(
    'BookStore API',
    {
        tag: ['@api', '@book-store'],
    },
    () => {
        test(
            'Get all books returns a list of books',
            {
                tag: ['@smoke'],
            },
            async ({ apiHelpers }) => {
                await test.step('Fetch all books from the API', async () => {
                    const response = await apiHelpers.getAllBooks();

                    expect(response.status).toBe(200);
                    expect(response.body.books).toBeDefined();
                    expect(response.body.books.length).toBeGreaterThan(0);
                });
            }
        );

        test('Get all books returns correct book structure', async ({ apiHelpers }) => {
            await test.step('Verify book object structure', async () => {
                const response = await apiHelpers.getAllBooks();
                const firstBook = response.body.books[0];

                expect(firstBook).toHaveProperty('isbn');
                expect(firstBook).toHaveProperty('title');
                expect(firstBook).toHaveProperty('subTitle');
                expect(firstBook).toHaveProperty('author');
                expect(firstBook).toHaveProperty('publisher');
                expect(firstBook).toHaveProperty('pages');
                expect(firstBook).toHaveProperty('description');
                expect(firstBook).toHaveProperty('website');
            });
        });

        test('Get book by ISBN returns correct book', async ({ apiHelpers }) => {
            const expectedBook = TestDataBuilder.getKnownBooks()[0];

            await test.step('Fetch book by ISBN', async () => {
                const response = await apiHelpers.getBookByIsbn(expectedBook.isbn);

                expect(response.status).toBe(200);
                expect(response.body.isbn).toBe(expectedBook.isbn);
                expect(response.body.title).toBe(expectedBook.title);
                expect(response.body.author).toBe(expectedBook.author);
                expect(response.body.publisher).toBe(expectedBook.publisher);
            });
        });

        test('Get book by invalid ISBN returns 400', async ({ apiHelpers }) => {
            await test.step('Fetch book with non-existent ISBN', async () => {
                const response = await apiHelpers.getBookByIsbn('0000000000000');

                expect(response.status).toBe(400);
            });
        });

        test('Verify all known books exist in the API', async ({ apiHelpers }) => {
            const knownBooks = TestDataBuilder.getKnownBooks();

            await test.step('Fetch all books and verify known books are present', async () => {
                const response = await apiHelpers.getAllBooks();
                const apiTitles = response.body.books.map((book: { title: string }) => book.title);

                for (const knownBook of knownBooks) {
                    expect(apiTitles).toContain(knownBook.title);
                }
            });
        });

        test('Add book to user collection', async ({ apiHelpers, apiTestUser }) => {
            const bookToAdd = TestDataBuilder.getKnownBooks()[0];

            await test.step('Add a known book to an isolated user', async () => {
                const response = await apiHelpers.addBooksToUser(
                    apiTestUser.userId,
                    apiTestUser.token,
                    [bookToAdd.isbn]
                );

                expect(response.status).toBe(201);
            });

            await test.step('Verify the book is present in the user collection', async () => {
                const userResponse = await apiHelpers.getUser(
                    apiTestUser.userId,
                    apiTestUser.token
                );

                expect(userResponse.status).toBe(200);
                expect(userResponse.body.books.map((book) => book.isbn)).toContain(bookToAdd.isbn);
                expect(userResponse.body.books.map((book) => book.title)).toContain(
                    bookToAdd.title
                );
            });
        });

        test('Delete book from user collection', async ({ apiHelpers, apiTestUser }) => {
            const bookToDelete = TestDataBuilder.getKnownBooks()[0];

            await test.step('Create a user collection with one book', async () => {
                const addResponse = await apiHelpers.addBooksToUser(
                    apiTestUser.userId,
                    apiTestUser.token,
                    [bookToDelete.isbn]
                );

                expect(addResponse.status).toBe(201);
            });

            await test.step('Delete the book from the user collection', async () => {
                const deleteResponse = await apiHelpers.deleteBookFromUser(
                    apiTestUser.userId,
                    apiTestUser.token,
                    bookToDelete.isbn
                );

                expect(deleteResponse.status).toBe(204);
            });

            await test.step('Verify the user collection is empty', async () => {
                const userResponse = await apiHelpers.getUser(
                    apiTestUser.userId,
                    apiTestUser.token
                );

                expect(userResponse.status).toBe(200);
                expect(userResponse.body.books.map((book) => book.isbn)).not.toContain(
                    bookToDelete.isbn
                );
            });
        });

        test('API response times are within acceptable limits', async ({ apiHelpers }) => {
            await test.step('Measure GET /BookStore/v1/Books response time', async () => {
                const start = Date.now();
                const response = await apiHelpers.getAllBooks();
                const duration = Date.now() - start;

                expect(response.status).toBe(200);
                expect(duration).toBeLessThan(5000);
            });
        });

        test('Book ISBN matches between list and detail endpoints', async ({ apiHelpers }) => {
            await test.step('Cross-reference book data between endpoints', async () => {
                const allBooksResponse = await apiHelpers.getAllBooks();
                const firstBookFromList = allBooksResponse.body.books[0];

                const detailResponse = await apiHelpers.getBookByIsbn(firstBookFromList.isbn);

                expect(detailResponse.body.isbn).toBe(firstBookFromList.isbn);
                expect(detailResponse.body.title).toBe(firstBookFromList.title);
                expect(detailResponse.body.author).toBe(firstBookFromList.author);
            });
        });
    }
);
