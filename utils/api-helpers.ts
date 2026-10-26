import { APIRequestContext } from '@playwright/test';
import { getApiBaseUrl } from '@config/environments';
import {
    AddBooksRequestSchema,
    DeleteBookRequestSchema,
    ReplaceBookRequestSchema,
} from '@schemas/book.schema';
import {
    CredentialsRequestSchema,
    CreatedUserEnvelopeSchema,
    TokenEnvelopeSchema,
} from '@schemas/account.schema';
import { parseApiResponse } from './schema-validators';

type ApiResult<T> = {
    status: number;
    body: T;
};

// Returns bodies as `unknown`. Specs parse the contract; this client also does setup,
// so it does not apply a success schema to every response. Request payloads are still
// validated here — a bad request is a test bug.
export class ApiHelpers {
    private readonly baseUrl: string;

    constructor(
        private readonly request: APIRequestContext,
        baseUrl: string = getApiBaseUrl()
    ) {
        this.baseUrl = baseUrl;
    }

    // ── Account endpoints ──

    async createUser(userName: string, password: string): Promise<ApiResult<unknown>> {
        const data = CredentialsRequestSchema.parse({ userName, password });
        const response = await this.request.post(`${this.baseUrl}/Account/v1/User`, {
            data,
        });

        return { status: response.status(), body: await response.json() };
    }

    async generateToken(userName: string, password: string): Promise<ApiResult<unknown>> {
        const data = CredentialsRequestSchema.parse({ userName, password });
        const response = await this.request.post(`${this.baseUrl}/Account/v1/GenerateToken`, {
            data,
        });

        return { status: response.status(), body: await response.json() };
    }

    async isAuthorized(userName: string, password: string): Promise<ApiResult<unknown>> {
        const data = CredentialsRequestSchema.parse({ userName, password });
        const response = await this.request.post(`${this.baseUrl}/Account/v1/Authorized`, {
            data,
        });

        return { status: response.status(), body: await response.json() };
    }

    async getUser(userId: string, token: string): Promise<ApiResult<unknown>> {
        const response = await this.request.get(`${this.baseUrl}/Account/v1/User/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        return { status: response.status(), body: await response.json() };
    }

    async deleteUser(userId: string, token: string): Promise<{ status: number }> {
        const response = await this.request.delete(`${this.baseUrl}/Account/v1/User/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        return { status: response.status() };
    }

    // ── BookStore endpoints ──

    async getAllBooks(): Promise<ApiResult<unknown>> {
        const response = await this.request.get(`${this.baseUrl}/BookStore/v1/Books`);

        return { status: response.status(), body: await response.json() };
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
        const data = AddBooksRequestSchema.parse({ userId, collectionOfIsbns });
        const response = await this.request.post(`${this.baseUrl}/BookStore/v1/Books`, {
            headers: { Authorization: `Bearer ${token}` },
            data,
        });

        return { status: response.status(), body: await response.json() };
    }

    async deleteBookFromUser(
        userId: string,
        token: string,
        isbn: string
    ): Promise<{ status: number }> {
        const data = DeleteBookRequestSchema.parse({ isbn, userId });
        const response = await this.request.delete(`${this.baseUrl}/BookStore/v1/Book`, {
            headers: { Authorization: `Bearer ${token}` },
            data,
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
        const data = ReplaceBookRequestSchema.parse({ userId, isbn: newIsbn });
        const response = await this.request.put(
            `${this.baseUrl}/BookStore/v1/Books/${currentIsbn}`,
            {
                headers: { Authorization: `Bearer ${token}` },
                data,
            }
        );

        return { status: response.status(), body: await response.json() };
    }

    // Loose envelopes: only the fields fixtures need (user id, token).

    // Account creation and token generation are separate steps on purpose: once the
    // account exists it must be cleaned up even if the token step fails.
    async createAccount(
        userName: string,
        password: string
    ): Promise<{ userId: string; userName: string }> {
        const userResponse = await this.createUser(userName, password);
        const user = parseApiResponse(CreatedUserEnvelopeSchema, userResponse.body);

        return { userId: user.userID, userName: user.username };
    }

    async fetchToken(userName: string, password: string): Promise<string> {
        const tokenResponse = await this.generateToken(userName, password);
        const { token } = parseApiResponse(TokenEnvelopeSchema, tokenResponse.body);

        if (!token) {
            throw new Error(`Failed to generate token for '${userName}': token was null`);
        }

        return token;
    }

    async createUserAndGetToken(userName: string, password: string) {
        const account = await this.createAccount(userName, password);
        const token = await this.fetchToken(userName, password);

        return { ...account, token };
    }
}
