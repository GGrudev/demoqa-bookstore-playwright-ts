import { test, expect } from '../stub-fixtures';
import createdUser from '../recorded/created-user.json';
import errorIsbnNotAvailable from '../recorded/error-isbn-not-available.json';
import tokenFailure from '../recorded/token-failure.json';
import tokenSuccess from '../recorded/token-success.json';
import userWithBook from '../recorded/user-with-book.json';

const TOKEN = 'stub-bearer-token';
const USER_ID = createdUser.userID;

test.describe(
    'ApiHelpers client (offline)',
    {
        tag: ['@offline', '@api-client'],
    },
    () => {
        test('sends the bearer token when fetching a user', async ({ stubApi, stubServer }) => {
            stubServer.queueResponse({ status: 200, body: userWithBook });

            const response = await stubApi.getUser(USER_ID, TOKEN);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(userWithBook);
            expect(stubServer.lastRequest.method).toBe('GET');
            expect(stubServer.lastRequest.path).toBe(`/Account/v1/User/${USER_ID}`);
            expect(stubServer.lastRequest.authorization).toBe(`Bearer ${TOKEN}`);
        });

        test('passes the ISBN as a query parameter', async ({ stubApi, stubServer }) => {
            stubServer.queueResponse({ status: 200, body: {} });

            await stubApi.getBookByIsbn('9781449325862');

            expect(stubServer.lastRequest.path).toBe('/BookStore/v1/Book');
            expect(stubServer.lastRequest.query.get('ISBN')).toBe('9781449325862');
        });

        test('passes the user id as a query parameter when clearing a collection', async ({
            stubApi,
            stubServer,
        }) => {
            stubServer.queueResponse({ status: 204 });

            const response = await stubApi.deleteAllBooksFromUser(USER_ID, TOKEN);

            expect(response.status).toBe(204);
            expect(stubServer.lastRequest.method).toBe('DELETE');
            expect(stubServer.lastRequest.query.get('UserId')).toBe(USER_ID);
        });

        test('maps an ISBN list into the collectionOfIsbns payload', async ({
            stubApi,
            stubServer,
        }) => {
            stubServer.queueResponse({ status: 201, body: { books: [] } });

            await stubApi.addBooksToUser(USER_ID, TOKEN, ['9781449325862', '9781449331818']);

            expect(stubServer.lastRequest.body).toEqual({
                userId: USER_ID,
                collectionOfIsbns: [{ isbn: '9781449325862' }, { isbn: '9781449331818' }],
            });
        });

        test('targets the current ISBN in the path when replacing a book', async ({
            stubApi,
            stubServer,
        }) => {
            stubServer.queueResponse({ status: 200, body: userWithBook });

            await stubApi.replaceBook(USER_ID, TOKEN, '9781449325862', '9781449331818');

            expect(stubServer.lastRequest.method).toBe('PUT');
            expect(stubServer.lastRequest.path).toBe('/BookStore/v1/Books/9781449325862');
            expect(stubServer.lastRequest.body).toEqual({
                userId: USER_ID,
                isbn: '9781449331818',
            });
        });

        test('returns error payloads verbatim instead of throwing', async ({
            stubApi,
            stubServer,
        }) => {
            stubServer.queueResponse({ status: 400, body: errorIsbnNotAvailable });

            const response = await stubApi.getBookByIsbn('0000000000000');

            expect(response.status).toBe(400);
            expect(response.body).toEqual(errorIsbnNotAvailable);
        });

        test('does not apply the strict book contract to setup responses', async ({
            stubApi,
            stubServer,
        }) => {
            stubServer.queueResponse({
                status: 200,
                body: { ...userWithBook, loyaltyTier: 'gold' },
            });

            const response = await stubApi.getUser(USER_ID, TOKEN);

            expect(response.status).toBe(200);
        });

        test('createUserAndGetToken returns the identifiers the fixtures need', async ({
            stubApi,
            stubServer,
        }) => {
            stubServer
                .queueResponse({ status: 201, body: createdUser })
                .queueResponse({ status: 200, body: tokenSuccess });

            const user = await stubApi.createUserAndGetToken('someUser', 'SomePass@123');

            expect(user).toEqual({
                userId: createdUser.userID,
                userName: createdUser.username,
                token: tokenSuccess.token,
            });
            expect(stubServer.requests.map((entry) => entry.path)).toEqual([
                '/Account/v1/User',
                '/Account/v1/GenerateToken',
            ]);
        });

        test('createUserAndGetToken fails clearly when no token is issued', async ({
            stubApi,
            stubServer,
        }) => {
            stubServer
                .queueResponse({ status: 201, body: createdUser })
                .queueResponse({ status: 200, body: tokenFailure });

            await expect(stubApi.createUserAndGetToken('someUser', 'SomePass@123')).rejects.toThrow(
                /token was null/
            );
        });

        test('rejects an invalid outgoing payload before it reaches the network', async ({
            stubApi,
            stubServer,
        }) => {
            await expect(stubApi.addBooksToUser('', TOKEN, ['9781449325862'])).rejects.toThrow(
                /userId/
            );
            expect(stubServer.requests).toHaveLength(0);
        });
    }
);
