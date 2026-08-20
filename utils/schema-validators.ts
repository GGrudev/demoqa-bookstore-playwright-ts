import { ZodSchema } from 'zod';

export function parseApiResponse<T>(schema: ZodSchema<T>, body: unknown): T {
    return schema.parse(body);
}
