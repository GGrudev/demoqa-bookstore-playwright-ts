import { test, expect } from '@playwright/test';
import {
    ApiErrorSchema,
    CreatedUserEnvelopeSchema,
    CreateUserResponseSchema,
    TokenEnvelopeSchema,
    TokenResponseSchema,
    UserResponseSchema,
} from '@schemas/account.schema';
import { BookSchema, BooksListSchema } from '@schemas/book.schema';
import { parseApiResponse } from '@utils/schema-validators';
import booksList from '../recorded/books-list.json';
import createdUser from '../recorded/created-user.json';
import errorIsbnNotAvailable from '../recorded/error-isbn-not-available.json';
import tokenFailure from '../recorded/token-failure.json';
import tokenSuccess from '../recorded/token-success.json';
import userWithBook from '../recorded/user-with-book.json';

// Runs against payloads recorded from DemoQA, so it needs no network and can gate
// every pull request. The negative cases below are the point of the suite: they prove
// the strict schemas actually reject drift rather than passing everything through.
test.describe(
    'API contracts (offline)',
    {
        tag: ['@offline', '@contract'],
    },
    () => {
        test('recorded books list satisfies the book-store contract', () => {
            const parsed = parseApiResponse(BooksListSchema, booksList);

            expect(parsed.books).toHaveLength(2);
            expect(parsed.books[0].isbn).toBe('9781449325862');
        });

        test('recorded user payload satisfies the account contract', () => {
            const parsed = parseApiResponse(UserResponseSchema, userWithBook);

            expect(parsed.username).toBe(userWithBook.username);
            expect(parsed.books.map((book) => book.isbn)).toEqual(['9781449325862']);
        });

        test('recorded created-user payload satisfies the account contract', () => {
            const parsed = parseApiResponse(CreateUserResponseSchema, createdUser);

            expect(parsed.userID).toBe(createdUser.userID);
            expect(parsed.books).toEqual([]);
        });

        test('recorded token payloads satisfy the token contract', () => {
            expect(parseApiResponse(TokenResponseSchema, tokenSuccess).status).toBe('Success');

            const failure = parseApiResponse(TokenResponseSchema, tokenFailure);
            expect(failure.status).toBe('Failed');
            expect(failure.token).toBeNull();
        });

        test('recorded error payload satisfies the error contract', () => {
            const parsed = parseApiResponse(ApiErrorSchema, errorIsbnNotAvailable);

            expect(parsed.code).toBe('1205');
        });

        test('an added field fails the strict book contract', () => {
            const drifted = { ...booksList.books[0], rating: 5 };

            expect(() => parseApiResponse(BookSchema, drifted)).toThrow(/rating/);
        });

        test('a retyped field fails the strict book contract', () => {
            const drifted = { ...booksList.books[0], pages: '234' };

            expect(() => parseApiResponse(BookSchema, drifted)).toThrow(/pages/);
        });

        test('a removed field fails the strict book contract', () => {
            const { author: _author, ...drifted } = booksList.books[0];

            expect(() => parseApiResponse(BookSchema, drifted)).toThrow(/author/);
        });

        test('a non-URL website fails the strict book contract', () => {
            const drifted = { ...booksList.books[0], website: 'not-a-url' };

            expect(() => parseApiResponse(BookSchema, drifted)).toThrow(/website/);
        });

        // The loose envelopes exist so setup code survives additive API changes that
        // must still be caught by the strict contracts above.
        test('setup envelopes tolerate added fields that the strict contracts reject', () => {
            const drifted = { ...createdUser, loyaltyTier: 'gold' };

            expect(() => parseApiResponse(CreateUserResponseSchema, drifted)).toThrow(
                /loyaltyTier/
            );
            expect(parseApiResponse(CreatedUserEnvelopeSchema, drifted).userID).toBe(
                createdUser.userID
            );
            expect(
                parseApiResponse(TokenEnvelopeSchema, { ...tokenSuccess, scope: 'all' }).token
            ).toBe(tokenSuccess.token);
        });

        test('setup envelopes still reject a missing required field', () => {
            expect(() => parseApiResponse(CreatedUserEnvelopeSchema, { username: 'x' })).toThrow(
                /userID/
            );
        });
    }
);
