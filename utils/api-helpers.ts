import { APIRequestContext } from '@playwright/test';
import { getApiBaseUrl } from '../config/environments';
import { BooksListSchema, BooksList } from '../schemas/book.schema';
import {
    CreateUserResponseSchema,
    UserResponseSchema,
    TokenResponseSchema,
    UserResponse,
    TokenResponse,
} from '../schemas/account.schema';
import { parseApiResponse } from './schema-validators';

type ApiResult<T> = {
    status: number;
    body: T;
};

export class ApiHelpers {
    private baseUrl: string;

    constructor(private request: APIRequestContext) {
        this.baseUrl = getApiBaseUrl();
    }

    // ── Account endpoints ──
    //
    // Endpoints exercised in both success and error scenarios return `body: unknown`
    // so callers validate against the schema that fits their scenario. Endpoints only
    // used for success are validated here and return a fully typed body.

    async createUser(userName: string, password: string): Promise<ApiResult<unknown>> {
        const response = await this.request.post(`${this.baseUrl}/Account/v1/User`, {
            data: { userName, password },
        });

        return { status: response.status(), body: await response.json() };
    }

    async generateToken(userName: string, password: string): Promise<ApiResult<TokenResponse>> {
        const response = await this.request.post(`${this.baseUrl}/Account/v1/GenerateToken`, {
            data: { userName, password },
        });

        return {
            status: response.status(),
            body: parseApiResponse(TokenResponseSchema, await response.json()),
        };
    }

    async isAuthorized(userName: string, password: string): Promise<ApiResult<unknown>> {
        const response = await this.request.post(`${this.baseUrl}/Account/v1/Authorized`, {
            data: { userName, password },
        });

        return { status: response.status(), body: await response.json() };
    }

    async getUser(userId: string, token: string): Promise<ApiResult<UserResponse>> {
        const response = await this.request.get(`${this.baseUrl}/Account/v1/User/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        return {
            status: response.status(),
            body: parseApiResponse(UserResponseSchema, await response.json()),
        };
    }

    async deleteUser(userId: string, token: string): Promise<{ status: number }> {
        const response = await this.request.delete(`${this.baseUrl}/Account/v1/User/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        return { status: response.status() };
    }

    // ── BookStore endpoints ──

    async getAllBooks(): Promise<ApiResult<BooksList>> {
        const response = await this.request.get(`${this.baseUrl}/BookStore/v1/Books`);

        return {
            status: response.status(),
            body: parseApiResponse(BooksListSchema, await response.json()),
        };
    }

    async getBookByIsbn(isbn: string): Promise<ApiResult<unknown>> {
        const response = await this.request.get(`${this.baseUrl}/BookStore/v1/Book`, {
            params: { ISBN: isbn },
        });

        return { status: response.status(), body: await response.json() };
    }

    async addBooksToUser(
        userId: string,
        token: string,
        isbns: string[]
    ): Promise<ApiResult<unknown>> {
        const collectionOfIsbns = isbns.map((isbn) => ({ isbn }));
        const response = await this.request.post(`${this.baseUrl}/BookStore/v1/Books`, {
            headers: { Authorization: `Bearer ${token}` },
            data: { userId, collectionOfIsbns },
        });

        return { status: response.status(), body: await response.json() };
    }

    async deleteBookFromUser(
        userId: string,
        token: string,
        isbn: string
    ): Promise<{ status: number }> {
        const response = await this.request.delete(`${this.baseUrl}/BookStore/v1/Book`, {
            headers: { Authorization: `Bearer ${token}` },
            data: { isbn, userId },
        });

        return { status: response.status() };
    }

    async deleteAllBooksFromUser(userId: string, token: string): Promise<{ status: number }> {
        const response = await this.request.delete(`${this.baseUrl}/BookStore/v1/Books`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { UserId: userId },
        });

        return { status: response.status() };
    }

    async replaceBook(
        userId: string,
        token: string,
        currentIsbn: string,
        newIsbn: string
    ): Promise<ApiResult<unknown>> {
        const response = await this.request.put(
            `${this.baseUrl}/BookStore/v1/Books/${currentIsbn}`,
            {
                headers: { Authorization: `Bearer ${token}` },
                data: { userId, isbn: newIsbn },
            }
        );

        return { status: response.status(), body: await response.json() };
    }

    // ── Helper: create user and get token in one call ──

    async createUserAndGetToken(userName: string, password: string) {
        const userResponse = await this.createUser(userName, password);
        const userBody = parseApiResponse(CreateUserResponseSchema, userResponse.body);
        const tokenResponse = await this.generateToken(userName, password);
        const token = tokenResponse.body.token;

        if (!token) {
            throw new Error(`Failed to generate token for '${userName}': token was null`);
        }

        return {
            userId: userBody.userID,
            userName: userBody.username,
            token,
        };
    }
}
