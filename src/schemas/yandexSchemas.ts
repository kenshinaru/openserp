import { z } from 'npm:zod';

// Schema for Yandex Web Search
export const yandexSearchSchema = z.object({
    query: z.string().min(1, 'Query is required'),
    site: z.string().optional(),
    filetype: z.string().optional(),
    dateInterval: z.string().optional(),
    langCode: z.string().optional(),
});

// Schema for Yandex Image Search
export const yandexImageSearchSchema = z.object({
    query: z.string().min(1, 'Query is required'),
    size: z.enum(['small', 'medium', 'large']).optional(),
    color: z.string().optional(),
    type: z.string().optional(),
}); 