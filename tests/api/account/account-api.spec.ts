import { test, expect } from '../../../fixtures/page-fixtures';
import { TestDataBuilder } from '../../../config/test-data';

test.describe(
    'Account API',
    {
        tag: ['@api', '@account'],
    },
    () => {
        test(
            'Generate token for API-created user',
            {
                tag: ['@smoke'],
            },
            async ({ apiHelpers, apiTestUser }) => {
                await test.step('Generate authentication token', async () => {
                    const response = await apiHelpers.generateToken(
                        apiTestUser.userName,
                        apiTestUser.password
                    );

                    expect(response.status).toBe(200);
                    expect(response.body.status).toBe('Success');
                    expect(response.body.result).toBe('User authorized successfully.');
                    expect(response.body.token).toBeTruthy();
                });
            }
        );

        test('Generate token fails for invalid user', async ({ apiHelpers }) => {
            const invalidUser = TestDataBuilder.createInvalidUser();

            await test.step('Attempt to generate token with invalid credentials', async () => {
                const response = await apiHelpers.generateToken(
                    invalidUser.userName,
                    invalidUser.password
                );

                expect(response.status).toBe(200);
                expect(response.body.status).toBe('Failed');
                expect(response.body.result).toBe('User authorization failed.');
            });
        });

        test('Check authorization for API-created user', async ({ apiHelpers, apiTestUser }) => {
            await test.step('Check if user is authorized', async () => {
                const response = await apiHelpers.isAuthorized(
                    apiTestUser.userName,
                    apiTestUser.password
                );

                expect(response.status).toBe(200);
                expect(response.body).toBe(true);
            });
        });

        test('Check authorization fails for invalid user', async ({ apiHelpers }) => {
            const invalidUser = TestDataBuilder.createInvalidUser();

            await test.step('Check authorization with invalid credentials', async () => {
                const response = await apiHelpers.isAuthorized(
                    invalidUser.userName,
                    invalidUser.password
                );

                expect(response.status).toBe(404);
                expect(response.body.code).toBe('1207');
                expect(response.body.message).toBe('User not found!');
            });
        });

        test('Get user details with valid token', async ({ apiHelpers, apiTestUser }) => {
            await test.step('Fetch user details by user id', async () => {
                const userResponse = await apiHelpers.getUser(
                    apiTestUser.userId,
                    apiTestUser.token
                );

                expect(userResponse.status).toBe(200);
                expect(userResponse.body.userId).toBe(apiTestUser.userId);
                expect(userResponse.body.username).toBe(apiTestUser.userName);
                expect(userResponse.body.books).toEqual([]);
            });
        });

        test('Create user fails with weak password', async ({ apiHelpers }) => {
            await test.step('Attempt to create user with weak password', async () => {
                const response = await apiHelpers.createUser('weakPassUser', 'abc');

                expect(response.status).toBe(400);
            });
        });

        test('Create user fails with existing username', async ({ apiHelpers, apiTestUser }) => {
            await test.step('Attempt to create user with existing username', async () => {
                const response = await apiHelpers.createUser(
                    apiTestUser.userName,
                    apiTestUser.password
                );

                expect(response.status).toBe(406);
            });
        });
    }
);
