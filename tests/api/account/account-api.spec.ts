import { test, expect } from '../../../fixtures/page-fixtures';
import { TestDataBuilder } from '../../../config/test-data';
import {
    ApiErrorSchema,
    TokenResponseSchema,
    UserResponseSchema,
} from '../../../schemas/account.schema';
import { parseApiResponse } from '../../../utils/schema-validators';

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
                    const tokenResponse = parseApiResponse(TokenResponseSchema, response.body);
                    expect(tokenResponse.status).toBe('Success');
                    expect(tokenResponse.result).toBe('User authorized successfully.');
                    expect(tokenResponse.token).toBeTruthy();
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
                const tokenResponse = parseApiResponse(TokenResponseSchema, response.body);
                expect(tokenResponse.status).toBe('Failed');
                expect(tokenResponse.result).toBe('User authorization failed.');
                expect(tokenResponse.token).toBeNull();
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
                const error = parseApiResponse(ApiErrorSchema, response.body);
                expect(error.code).toBe('1207');
                expect(error.message).toBe('User not found!');
            });
        });

        test('Get user details with valid token', async ({ apiHelpers, apiTestUser }) => {
            await test.step('Fetch user details by user id', async () => {
                const userResponse = await apiHelpers.getUser(
                    apiTestUser.userId,
                    apiTestUser.token
                );

                expect(userResponse.status).toBe(200);
                const user = parseApiResponse(UserResponseSchema, userResponse.body);
                expect(user.userId).toBe(apiTestUser.userId);
                expect(user.username).toBe(apiTestUser.userName);
                expect(user.books).toEqual([]);
            });
        });

        test('Create user fails with weak password', async ({ apiHelpers }) => {
            await test.step('Attempt to create user with weak password', async () => {
                const response = await apiHelpers.createUser('weakPassUser', 'abc');

                expect(response.status).toBe(400);
                const error = parseApiResponse(ApiErrorSchema, response.body);
                expect(error.code).toBe('1300');
                expect(error.message).toContain('Passwords must have');
            });
        });

        test('Create user fails with existing username', async ({ apiHelpers, apiTestUser }) => {
            await test.step('Attempt to create user with existing username', async () => {
                const response = await apiHelpers.createUser(
                    apiTestUser.userName,
                    apiTestUser.password
                );

                expect(response.status).toBe(406);
                const error = parseApiResponse(ApiErrorSchema, response.body);
                expect(error.code).toBe('1204');
                expect(error.message).toBe('User exists!');
            });
        });
    }
);
