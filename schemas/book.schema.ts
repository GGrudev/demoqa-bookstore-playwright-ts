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

export const IsbnReferenceSchema = z.strictObject({
    isbn: z.string().min(1),
});

export const AddBooksRequestSchema = z.strictObject({
    userId: z.string().min(1),
    collectionOfIsbns: z.array(IsbnReferenceSchema),
});

export const AddBooksResponseSchema = z.strictObject({
    books: z.array(IsbnReferenceSchema),
});

export const DeleteBookRequestSchema = z.strictObject({
    isbn: z.string().min(1),
    userId: z.string().min(1),
});

export const ReplaceBookRequestSchema = z.strictObject({
    userId: z.string().min(1),
    isbn: z.string().min(1),
});

export type Book = z.infer<typeof BookSchema>;
export type BooksList = z.infer<typeof BooksListSchema>;
export type AddBooksRequest = z.infer<typeof AddBooksRequestSchema>;
export type AddBooksResponse = z.infer<typeof AddBooksResponseSchema>;
export type DeleteBookRequest = z.infer<typeof DeleteBookRequestSchema>;
export type ReplaceBookRequest = z.infer<typeof ReplaceBookRequestSchema>;
