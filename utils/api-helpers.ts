import { APIRequestContext } from '@playwright/test';
import { getApiBaseUrl } from '../config/environments';

export interface ApiCreateUserResponse {
    userID: string;
    username: string;
    books: ApiBookResponse[];
}

export interface ApiUserResponse {
    userId: string;
    username: string;
    books: ApiBookResponse[];
}

export interface ApiBookResponse {
    isbn: string;
    title: string;
    subTitle: string;
    author: string;
    publish_date: string;
    publisher: string;
    pages: number;
    description: string;
    website: string;
}

export interface ApiTokenResponse {
    token: string;
    expires: string;
    status: string;
    result: string;
}

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
        return {
            status: response.status(),
            body: (await response.json()) as ApiCreateUserResponse,
        };
    }

    async generateToken(userName: string, password: string) {
        const response = await this.request.post(`${this.baseUrl}/Account/v1/GenerateToken`, {
            data: { userName, password },
        });
        return {
            status: response.status(),
            body: (await response.json()) as ApiTokenResponse,
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
        return {
            status: response.status(),
            body: (await response.json()) as ApiUserResponse,
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
        return {
            status: response.status(),
            body: (await response.json()) as { books: ApiBookResponse[] },
        };
    }

    async getBookByIsbn(isbn: string) {
        const response = await this.request.get(`${this.baseUrl}/BookStore/v1/Book`, {
            params: { ISBN: isbn },
        });
        return {
            status: response.status(),
            body: (await response.json()) as ApiBookResponse,
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
        const tokenResponse = await this.generateToken(userName, password);

        return {
            userId: userResponse.body.userID,
            userName: userResponse.body.username,
            token: tokenResponse.body.token,
        };
    }
}
