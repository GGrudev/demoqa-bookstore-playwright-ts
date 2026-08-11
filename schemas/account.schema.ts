import { z } from 'zod';
import { BookSchema } from './book.schema';

export const CredentialsRequestSchema = z.strictObject({
    userName: z.string().min(1),
    password: z.string().min(1),
});

export const CreateUserResponseSchema = z.strictObject({
    userID: z.string().min(1),
    username: z.string().min(1),
    books: z.array(BookSchema),
});

export const UserResponseSchema = z.strictObject({
    userId: z.string().min(1),
    username: z.string().min(1),
    books: z.array(BookSchema),
});

export const TokenResponseSchema = z.strictObject({
    token: z.string().nullable(),
    expires: z.string().nullable(),
    status: z.enum(['Success', 'Failed']),
    result: z.string(),
});

export const ApiErrorSchema = z.strictObject({
    code: z.string(),
    message: z.string(),
});

// Setup envelopes. Deliberately loose and limited to the fields fixtures depend on:
// a new or renamed DemoQA field must fail the contract specs above, not every test
// that happens to create a user during setup.
export const CreatedUserEnvelopeSchema = z.looseObject({
    userID: z.string().min(1),
    username: z.string().min(1),
});

export const TokenEnvelopeSchema = z.looseObject({
    token: z.string().nullable(),
});

export type CreateUserResponse = z.infer<typeof CreateUserResponseSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type TokenResponse = z.infer<typeof TokenResponseSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
export type CredentialsRequest = z.infer<typeof CredentialsRequestSchema>;
export type CreatedUserEnvelope = z.infer<typeof CreatedUserEnvelopeSchema>;
export type TokenEnvelope = z.infer<typeof TokenEnvelopeSchema>;
