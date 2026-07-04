import { test, expect } from '../../../fixtures/page-fixtures';
import { TestDataBuilder } from '../../../config/test-data';
import { BooksListSchema, BookSchema } from '../../../schemas/book.schema';
import { UserResponseSchema } from '../../../schemas/account.schema';
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
                const user = parseApiResponse(UserResponseSchema, userResponse.body);
                expect(user.books.map((book) => book.isbn)).not.toContain(bookToDelete.isbn);
            });
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
            });

            await test.step('Replace book via API', async () => {
                const response = await apiHelpers.replaceBook(
                    apiTestUser.userId,
                    apiTestUser.token,
                    originalBook.isbn,
                    replacementBook.isbn
                );

                expect(response.status).toBe(200);
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
                const booksList = parseApiResponse(BooksListSchema, allBooksResponse.body);
                const firstBookFromList = booksList.books[0];

                const detailResponse = await apiHelpers.getBookByIsbn(firstBookFromList.isbn);
                const bookDetail = parseApiResponse(BookSchema, detailResponse.body);

                expect(bookDetail.isbn).toBe(firstBookFromList.isbn);
                expect(bookDetail.title).toBe(firstBookFromList.title);
                expect(bookDetail.author).toBe(firstBookFromList.author);
            });
        });
    }
);
