import { z } from 'zod';

export const BookSchema = z.object({
    isbn: z.string().min(10),
    title: z.string().min(1),
    subTitle: z.string(),
    author: z.string(),
    publish_date: z.string(),
    publisher: z.string(),
    pages: z.number().int().positive(),
    description: z.string(),
    website: z.string(),
});

export const BooksListSchema = z.object({
    books: z.array(BookSchema).min(1),
});

export type Book = z.infer<typeof BookSchema>;
export type BooksList = z.infer<typeof BooksListSchema>;
