import { test, expect } from '@fixtures/page-fixtures';
import { TestDataBuilder } from '@config/test-data';
import { loginViaUi } from '@utils/auth-flow';
import { AddBooksResponseSchema } from '@schemas/book.schema';
import { parseApiResponse } from '@utils/schema-validators';
import { attachJson } from '@utils/test-diagnostics';

test.describe(
    'Profile - Manage book collection',
    {
        tag: ['@e2e', '@profile'],
    },
    () => {
        test(
            'Profile page shows not logged in message for unauthenticated users',
            {
                tag: ['@smoke'],
            },
            async ({ profilePage }) => {
                await test.step('Navigate to profile without login', async () => {
                    await profilePage.goToProfile();
                });

                await test.step('Verify not logged in message', async () => {
                    await profilePage.header.expectNotLoggedInMessage();
                });
            }
        );

        test(
            'API-created collection is visible in profile',
            {
                tag: ['@smoke'],
            },
            async ({ apiHelpers, apiTestUser, page, profilePage }) => {
                const bookToAdd = TestDataBuilder.getKnownBooks()[0];
                await attachJson('collection-context', {
                    userId: apiTestUser.userId,
                    userName: apiTestUser.userName,
                    isbn: bookToAdd.isbn,
                    title: bookToAdd.title,
                });

                await test.step('Prepare user collection through API', async () => {
                    const response = await apiHelpers.addBooksToUser(
                        apiTestUser.userId,
                        apiTestUser.token,
                        [bookToAdd.isbn]
                    );

                    expect(response.status).toBe(201);
                    expect(
                        parseApiResponse(AddBooksResponseSchema, response.body).books
                    ).toContainEqual({ isbn: bookToAdd.isbn });
                });

                await test.step('Login through UI with the API-created user', async () => {
                    await loginViaUi(page, apiTestUser);
                });

                await test.step('Verify the API-created collection in the UI profile', async () => {
                    await profilePage.goToProfile();
                    await profilePage.header.expectLoggedIn(apiTestUser.userName);
                    await profilePage.verifyBookInProfile(bookToAdd.title);
                });
            }
        );
    }
);
