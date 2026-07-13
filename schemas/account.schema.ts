import { z } from 'zod';
import { BookSchema } from './book.schema';

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

export type CreateUserResponse = z.infer<typeof CreateUserResponseSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type TokenResponse = z.infer<typeof TokenResponseSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
