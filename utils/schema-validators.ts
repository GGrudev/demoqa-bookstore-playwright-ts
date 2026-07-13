import { ZodSchema } from 'zod';

// Validates an API payload against a Zod schema at runtime, returning the typed value.
// Throws a descriptive ZodError (with the failing field path) on a contract mismatch.
export function parseApiResponse<T>(schema: ZodSchema<T>, body: unknown): T {
    return schema.parse(body);
}
