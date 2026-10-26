import { test, expect } from '../stub-fixtures';
import { runWithApiTestUser, type LeakedUserReport } from '@utils/api-test-user';
import createdUser from '../recorded/created-user.json';
import errorIsbnNotAvailable from '../recorded/error-isbn-not-available.json';
import tokenFailure from '../recorded/token-failure.json';
import tokenSuccess from '../recorded/token-success.json';

const credentials = { userName: 'someUser', password: 'SomePass@123' };
const CREATE = 'POST /Account/v1/User';
const TOKEN = 'POST /Account/v1/GenerateToken';
const DELETE = `DELETE /Account/v1/User/${createdUser.userID}`;

function leakCollector() {
    const leaks: LeakedUserReport[] = [];

    return {
        leaks,
        onCleanupFailure: async (leaked: LeakedUserReport) => {
            leaks.push(leaked);
        },
    };
}

test.describe(
    'API test user lifecycle (offline)',
    {
        tag: ['@offline', '@fixtures'],
    },
    () => {
        test('creates the user, hands it to the test, then deletes it', async ({
            stubApi,
            stubServer,
        }) => {
            stubServer
                .queueResponse({ status: 201, body: createdUser })
                .queueResponse({ status: 200, body: tokenSuccess })
                .queueResponse({ status: 200, body: tokenSuccess })
                .queueResponse({ status: 204 });
            const { leaks, onCleanupFailure } = leakCollector();
            const received: unknown[] = [];

            await runWithApiTestUser(
                stubApi,
                credentials,
                async (user) => {
                    received.push(user);
                },
                onCleanupFailure
            );

            expect(received).toEqual([
                {
                    userId: createdUser.userID,
                    userName: createdUser.username,
                    password: credentials.password,
                    token: tokenSuccess.token,
                },
            ]);
            expect(stubServer.requests.map((r) => `${r.method} ${r.path}`)).toEqual([
                CREATE,
                TOKEN,
                TOKEN,
                DELETE,
            ]);
            expect(leaks).toEqual([]);
        });

        test('still deletes the user when the test body throws', async ({
            stubApi,
            stubServer,
        }) => {
            stubServer
                .queueResponse({ status: 201, body: createdUser })
                .queueResponse({ status: 200, body: tokenSuccess })
                .queueResponse({ status: 200, body: tokenSuccess })
                .queueResponse({ status: 204 });
            const { leaks, onCleanupFailure } = leakCollector();

            await expect(
                runWithApiTestUser(
                    stubApi,
                    credentials,
                    async () => {
                        throw new Error('test body failed');
                    },
                    onCleanupFailure
                )
            ).rejects.toThrow('test body failed');

            expect(stubServer.lastRequest.method).toBe('DELETE');
            expect(stubServer.lastRequest.path).toBe(`/Account/v1/User/${createdUser.userID}`);
            expect(leaks).toEqual([]);
        });

        test('deletes the user when the token step fails after the account exists', async ({
            stubApi,
            stubServer,
        }) => {
            // Create succeeds, the first token request fails, the cleanup token succeeds.
            stubServer
                .queueResponse({ status: 201, body: createdUser })
                .queueResponse({ status: 200, body: tokenFailure })
                .queueResponse({ status: 200, body: tokenSuccess })
                .queueResponse({ status: 204 });
            const { leaks, onCleanupFailure } = leakCollector();
            const received: unknown[] = [];

            await expect(
                runWithApiTestUser(
                    stubApi,
                    credentials,
                    async (user) => {
                        received.push(user);
                    },
                    onCleanupFailure
                )
            ).rejects.toThrow(/token was null/);

            expect(received).toEqual([]);
            expect(stubServer.requests.map((r) => `${r.method} ${r.path}`)).toEqual([
                CREATE,
                TOKEN,
                TOKEN,
                DELETE,
            ]);
            expect(leaks).toEqual([]);
        });

        test('reports the user as leaked when cleanup also fails after a token failure', async ({
            stubApi,
            stubServer,
        }) => {
            stubServer
                .queueResponse({ status: 201, body: createdUser })
                .queueResponse({ status: 200, body: tokenFailure })
                .queueResponse({ status: 200, body: tokenFailure });
            const { leaks, onCleanupFailure } = leakCollector();

            await expect(
                runWithApiTestUser(stubApi, credentials, async () => {}, onCleanupFailure)
            ).rejects.toThrow(/token was null/);

            expect(stubServer.requests.map((r) => `${r.method} ${r.path}`)).toEqual([
                CREATE,
                TOKEN,
                TOKEN,
            ]);
            expect(leaks).toEqual([
                {
                    userId: createdUser.userID,
                    userName: createdUser.username,
                    password: credentials.password,
                    reason: 'token request returned no token',
                },
            ]);
        });

        test('does not start cleanup when account creation fails', async ({
            stubApi,
            stubServer,
        }) => {
            stubServer.queueResponse({ status: 400, body: errorIsbnNotAvailable });
            const { leaks, onCleanupFailure } = leakCollector();

            await expect(
                runWithApiTestUser(stubApi, credentials, async () => {}, onCleanupFailure)
            ).rejects.toThrow();

            expect(stubServer.requests.map((r) => `${r.method} ${r.path}`)).toEqual([CREATE]);
            expect(leaks).toEqual([]);
        });
    }
);
