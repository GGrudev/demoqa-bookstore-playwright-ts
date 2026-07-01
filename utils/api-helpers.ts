import { APIRequestContext } from '@playwright/test';
import { getApiBaseUrl } from '../config/environments';
import { BookSchema, BooksListSchema, Book, BooksList } from '../schemas/book.schema';
import {
    CreateUserResponseSchema,
    UserResponseSchema,
    TokenResponseSchema,
    CreateUserResponse,
    UserResponse,
    TokenResponse,
} from '../schemas/account.schema';
import { parseApiResponse, parseApiResponseIfSuccess } from './schema-validators';

export type ApiCreateUserResponse = CreateUserResponse;
export type ApiUserResponse = UserResponse;
export type ApiBookResponse = Book;
export type ApiTokenResponse = TokenResponse;

export class ApiHelpers {
    private baseUrl: string;

    constructor(private request: APIRequestContext) {
        this.baseUrl = getApiBaseUrl();
    }

    // ── Account endpoints ──

    async createUser(userName: string, password: string) {
        const response = await this.request.post(`${this.baseUrl}/Account/v1/User`, {
            data: { userName, password },
        });
        const status = response.status();
        const body = await response.json();

        return {
            status,
            body: parseApiResponseIfSuccess(status, CreateUserResponseSchema, body) as
                | CreateUserResponse
                | unknown,
        };
    }

    async generateToken(userName: string, password: string) {
        const response = await this.request.post(`${this.baseUrl}/Account/v1/GenerateToken`, {
            data: { userName, password },
        });
        const body = await response.json();

        return {
            status: response.status(),
            body: parseApiResponse(TokenResponseSchema, body),
        };
    }

    async isAuthorized(userName: string, password: string) {
        const response = await this.request.post(`${this.baseUrl}/Account/v1/Authorized`, {
            data: { userName, password },
        });

        return {
            status: response.status(),
            body: await response.json(),
        };
    }

    async getUser(userId: string, token: string) {
        const response = await this.request.get(`${this.baseUrl}/Account/v1/User/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const status = response.status();
        const body = await response.json();

        return {
            status,
            body: parseApiResponseIfSuccess(status, UserResponseSchema, body) as
                | UserResponse
                | unknown,
        };
    }

    async deleteUser(userId: string, token: string) {
        const response = await this.request.delete(`${this.baseUrl}/Account/v1/User/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return { status: response.status() };
    }

    // ── BookStore endpoints ──

    async getAllBooks() {
        const response = await this.request.get(`${this.baseUrl}/BookStore/v1/Books`);
        const status = response.status();
        const body = await response.json();

        return {
            status,
            body: parseApiResponseIfSuccess(status, BooksListSchema, body) as BooksList | unknown,
        };
    }

    async getBookByIsbn(isbn: string) {
        const response = await this.request.get(`${this.baseUrl}/BookStore/v1/Book`, {
            params: { ISBN: isbn },
        });
        const status = response.status();
        const body = await response.json();

        return {
            status,
            body: parseApiResponseIfSuccess(status, BookSchema, body) as Book | unknown,
        };
    }

    async addBooksToUser(userId: string, token: string, isbns: string[]) {
        const collectionOfIsbns = isbns.map((isbn) => ({ isbn }));
        const response = await this.request.post(`${this.baseUrl}/BookStore/v1/Books`, {
            headers: { Authorization: `Bearer ${token}` },
            data: { userId, collectionOfIsbns },
        });
        return {
            status: response.status(),
            body: await response.json(),
        };
    }

    async deleteBookFromUser(userId: string, token: string, isbn: string) {
        const response = await this.request.delete(`${this.baseUrl}/BookStore/v1/Book`, {
            headers: { Authorization: `Bearer ${token}` },
            data: { isbn, userId },
        });
        return { status: response.status() };
    }

    async deleteAllBooksFromUser(userId: string, token: string) {
        const response = await this.request.delete(`${this.baseUrl}/BookStore/v1/Books`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { UserId: userId },
        });
        return { status: response.status() };
    }

    async replaceBook(userId: string, token: string, currentIsbn: string, newIsbn: string) {
        const response = await this.request.put(
            `${this.baseUrl}/BookStore/v1/Books/${currentIsbn}`,
            {
                headers: { Authorization: `Bearer ${token}` },
                data: { userId, isbn: newIsbn },
            }
        );
        return {
            status: response.status(),
            body: await response.json(),
        };
    }

    // ── Helper: create user and get token in one call ──

    async createUserAndGetToken(userName: string, password: string) {
        const userResponse = await this.createUser(userName, password);
        const userBody = parseApiResponse(CreateUserResponseSchema, userResponse.body);
        const tokenResponse = await this.generateToken(userName, password);

        return {
            userId: userBody.userID,
            userName: userBody.username,
            token: tokenResponse.body.token,
        };
    }
}
