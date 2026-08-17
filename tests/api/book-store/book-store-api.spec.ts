import { test, expect } from '../../../fixtures/page-fixtures';
import { TestDataBuilder } from '../../../config/test-data';
import { AddBooksResponseSchema, BookSchema, BooksListSchema } from '../../../schemas/book.schema';
import { ApiErrorSchema, UserResponseSchema } from '../../../schemas/account.schema';
import { parseApiResponse } from '../../../utils/schema-validators';

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
                    const booksList = parseApiResponse(BooksListSchema, response.body);
                    expect(booksList.books.length).toBeGreaterThan(0);
                });
            }
        );

        test('Get all books response matches Zod book contract', async ({ apiHelpers }) => {
            await test.step('Validate every book in the list against BookSchema', async () => {
                const response = await apiHelpers.getAllBooks();
                const booksList = parseApiResponse(BooksListSchema, response.body);

                for (const book of booksList.books) {
                    expect(parseApiResponse(BookSchema, book)).toEqual(book);
                }
            });
        });

        test('Get book by ISBN returns correct book', async ({ apiHelpers }) => {
            const expectedBook = TestDataBuilder.getKnownBooks()[0];

            await test.step('Fetch book by ISBN', async () => {
                const response = await apiHelpers.getBookByIsbn(expectedBook.isbn);

                expect(response.status).toBe(200);
                const book = parseApiResponse(BookSchema, response.body);
                expect(book.isbn).toBe(expectedBook.isbn);
                expect(book.title).toBe(expectedBook.title);
                expect(book.author).toBe(expectedBook.author);
                expect(book.publisher).toBe(expectedBook.publisher);
            });
        });

        test('Get book by invalid ISBN returns 400', async ({ apiHelpers }) => {
            await test.step('Fetch book with non-existent ISBN', async () => {
                const response = await apiHelpers.getBookByIsbn('0000000000000');

                expect(response.status).toBe(400);
                const error = parseApiResponse(ApiErrorSchema, response.body);
                expect(error.code).toBe('1205');
                expect(error.message).toContain('ISBN supplied is not available');
            });
        });

        test('Verify all known books exist in the API', async ({ apiHelpers }) => {
            const knownBooks = TestDataBuilder.getKnownBooks();

            await test.step('Fetch all books and verify known books are present', async () => {
                const response = await apiHelpers.getAllBooks();
                const booksList = parseApiResponse(BooksListSchema, response.body);
                const apiTitles = booksList.books.map((book) => book.title);

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
                const result = parseApiResponse(AddBooksResponseSchema, response.body);
                expect(result.books).toContainEqual({ isbn: bookToAdd.isbn });
            });

            await test.step('Verify the book is present in the user collection', async () => {
                const userResponse = await apiHelpers.getUser(
                    apiTestUser.userId,
                    apiTestUser.token
                );

                expect(userResponse.status).toBe(200);
                const user = parseApiResponse(UserResponseSchema, userResponse.body);
                expect(user.books.map((book) => book.isbn)).toContain(bookToAdd.isbn);
                expect(user.books.map((book) => book.title)).toContain(bookToAdd.title);
            });
        });

        for (const scenario of [
            { name: 'missing token', token: '' },
            { name: 'invalid token', token: 'not-a-valid-token' },
        ]) {
            test(`Add book rejects ${scenario.name}`, async ({ apiHelpers, apiTestUser }) => {
                const bookToAdd = TestDataBuilder.getKnownBooks()[0];

                const response = await apiHelpers.addBooksToUser(
                    apiTestUser.userId,
                    scenario.token,
                    [bookToAdd.isbn]
                );

                expect(response.status).toBe(401);
                const error = parseApiResponse(ApiErrorSchema, response.body);
                expect(error.code).toBe('1200');
                expect(error.message).toBe('User not authorized!');
            });
        }

        test('Add book rejects an invalid ISBN', async ({ apiHelpers, apiTestUser }) => {
            const response = await apiHelpers.addBooksToUser(
                apiTestUser.userId,
                apiTestUser.token,
                ['0000000000000']
            );

            expect(response.status).toBe(400);
            const error = parseApiResponse(ApiErrorSchema, response.body);
            expect(error.code).toBe('1205');
            expect(error.message).toContain('ISBN supplied is not available');
        });

        test('Add book rejects a duplicate ISBN', async ({ apiHelpers, apiTestUser }) => {
            const bookToAdd = TestDataBuilder.getKnownBooks()[0];
            const firstResponse = await apiHelpers.addBooksToUser(
                apiTestUser.userId,
                apiTestUser.token,
                [bookToAdd.isbn]
            );
            expect(firstResponse.status).toBe(201);
            parseApiResponse(AddBooksResponseSchema, firstResponse.body);

            const duplicateResponse = await apiHelpers.addBooksToUser(
                apiTestUser.userId,
                apiTestUser.token,
                [bookToAdd.isbn]
            );

            expect(duplicateResponse.status).toBe(400);
            const error = parseApiResponse(ApiErrorSchema, duplicateResponse.body);
            expect(error.code).toBe('1210');
            expect(error.message).toBe("ISBN already present in the User's Collection!");
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
                expect(
                    parseApiResponse(AddBooksResponseSchema, addResponse.body).books
                ).toContainEqual({ isbn: bookToDelete.isbn });
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
                const user = parseApiResponse(UserResponseSchema, userResponse.body);
                expect(user.books.map((book) => book.isbn)).not.toContain(bookToDelete.isbn);
            });
        });

        test('Delete all books from user collection', async ({ apiHelpers, apiTestUser }) => {
            const booksToDelete = TestDataBuilder.getKnownBooks().slice(0, 2);
            const addResponse = await apiHelpers.addBooksToUser(
                apiTestUser.userId,
                apiTestUser.token,
                booksToDelete.map((book) => book.isbn)
            );
            expect(addResponse.status).toBe(201);
            expect(parseApiResponse(AddBooksResponseSchema, addResponse.body).books).toHaveLength(
                2
            );

            const deleteResponse = await apiHelpers.deleteAllBooksFromUser(
                apiTestUser.userId,
                apiTestUser.token
            );
            expect(deleteResponse.status).toBe(204);

            const userResponse = await apiHelpers.getUser(apiTestUser.userId, apiTestUser.token);
            expect(userResponse.status).toBe(200);
            expect(parseApiResponse(UserResponseSchema, userResponse.body).books).toEqual([]);
        });

        test('Replace book in user collection', async ({ apiHelpers, apiTestUser }) => {
            const originalBook = TestDataBuilder.getKnownBooks()[0];
            const replacementBook = TestDataBuilder.getKnownBooks()[1];

            await test.step('Add original book to user collection', async () => {
                const response = await apiHelpers.addBooksToUser(
                    apiTestUser.userId,
                    apiTestUser.token,
                    [originalBook.isbn]
                );

                expect(response.status).toBe(201);
                expect(
                    parseApiResponse(AddBooksResponseSchema, response.body).books
                ).toContainEqual({
                    isbn: originalBook.isbn,
                });
            });

            await test.step('Replace book via API', async () => {
                const response = await apiHelpers.replaceBook(
                    apiTestUser.userId,
                    apiTestUser.token,
                    originalBook.isbn,
                    replacementBook.isbn
                );

                expect(response.status).toBe(200);
                const result = parseApiResponse(UserResponseSchema, response.body);
                expect(result.books.map((book) => book.isbn)).toContain(replacementBook.isbn);
            });

            await test.step('Verify collection contains replacement book only', async () => {
                const userResponse = await apiHelpers.getUser(
                    apiTestUser.userId,
                    apiTestUser.token
                );

                expect(userResponse.status).toBe(200);
                const user = parseApiResponse(UserResponseSchema, userResponse.body);
                expect(user.books.map((book) => book.isbn)).toContain(replacementBook.isbn);
                expect(user.books.map((book) => book.isbn)).not.toContain(originalBook.isbn);
            });
        });

        test('Books endpoint responds and its latency is recorded', async ({
            apiHelpers,
        }, testInfo) => {
            await test.step('Measure GET /BookStore/v1/Books response time', async () => {
                const start = Date.now();
                const response = await apiHelpers.getAllBooks();
                const durationMs = Date.now() - start;

                expect(response.status).toBe(200);

                // Recorded rather than asserted. DemoQA is shared public infrastructure,
                // so a latency threshold here would gate the suite on the internet and
                // the demo host instead of on the application.
                testInfo.annotations.push({
                    type: 'latency',
                    description: `GET /BookStore/v1/Books took ${durationMs}ms`,
                });
            });
        });

        test('Book ISBN matches between list and detail endpoints', async ({ apiHelpers }) => {
            await test.step('Cross-reference book data between endpoints', async () => {
                const allBooksResponse = await apiHelpers.getAllBooks();
                const firstBookFromList = parseApiResponse(BooksListSchema, allBooksResponse.body)
                    .books[0];

                const detailResponse = await apiHelpers.getBookByIsbn(firstBookFromList.isbn);
                const bookDetail = parseApiResponse(BookSchema, detailResponse.body);

                expect(bookDetail.isbn).toBe(firstBookFromList.isbn);
                expect(bookDetail.title).toBe(firstBookFromList.title);
                expect(bookDetail.author).toBe(firstBookFromList.author);
            });
        });
    }
);
