import { z } from 'npm:zod';

// Schema for Baidu Web Search
export const baiduSearchSchema = z.object({
    query: z.string().min(1, 'Query is required'),
    site: z.string().optional(),
    filetype: z.string().optional(),
    dateInterval: z.string().optional(),
    langCode: z.string().optional(),
});

// Schema for Baidu Image Search
export const baiduImageSearchSchema = z.object({
    query: z.string().min(1, 'Query is required'),
    size: z.enum(['small', 'medium', 'large']).optional(),
    color: z.string().optional(),
    type: z.string().optional(),
}); 