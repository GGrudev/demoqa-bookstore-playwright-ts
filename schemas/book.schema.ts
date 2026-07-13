import { z } from 'zod';

// strictObject rejects unexpected/renamed fields, so a drifting API contract
// (added, removed, or retyped fields) fails loudly instead of passing silently.
export const BookSchema = z.strictObject({
    isbn: z.string().min(10),
    title: z.string().min(1),
    subTitle: z.string(),
    author: z.string(),
    publish_date: z.iso.datetime(),
    publisher: z.string(),
    pages: z.number().int().positive(),
    description: z.string(),
    website: z.url(),
});

export const BooksListSchema = z.strictObject({
    books: z.array(BookSchema).min(1),
});

export type Book = z.infer<typeof BookSchema>;
export type BooksList = z.infer<typeof BooksListSchema>;
