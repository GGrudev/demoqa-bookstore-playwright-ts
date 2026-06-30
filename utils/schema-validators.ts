import { ZodSchema } from 'zod';

export function parseApiResponse<T>(schema: ZodSchema<T>, body: unknown): T {
    return schema.parse(body);
}

export function parseApiResponseIfSuccess<T>(
    status: number,
    schema: ZodSchema<T>,
    body: unknown
): T | unknown {
    if (status >= 200 && status < 300) {
        return parseApiResponse(schema, body);
    }

    return body;
}
