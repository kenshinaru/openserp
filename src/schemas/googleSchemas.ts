import { z } from 'npm:zod';

// Schema for Google Web Search
export const googleSearchSchema = z.object({
    query: z.string().min(1, 'Query is required'),
    site: z.string().optional(),
    filetype: z.string().optional(),
    dateInterval: z.string().optional(),
    langCode: z.string().optional(),
});

// Schema for Google Image Search
export const googleImageSearchSchema = z.object({
    query: z.string().min(1, 'Query is required'),
    size: z.enum(['small', 'medium', 'large']).optional(),
    color: z.string().optional(),
    type: z.string().optional(),
}); 