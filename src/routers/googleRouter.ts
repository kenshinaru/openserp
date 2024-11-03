import { OpenAPIHono, createRoute, z } from 'npm:@hono/zod-openapi';
import { SearchService, SearchProvider, SearchType } from '../services/searchService.ts';
import { Browser, BrowserContext } from 'npm:playwright';
import { Context } from 'npm:hono';

const googleRouter = new OpenAPIHono();

// Define schemas for query parameters and responses
const googleSearchSchema = z.object({
    query: z.string().min(1).openapi({
        example: 'OpenAI',
    }),
});

const googleSearchResponseSchema = z.array(z.object({
    rank: z.number().openapi({
        example: 1,
    }),
    url: z.string().url().openapi({
        example: 'https://www.example.com',
    }),
    title: z.string().openapi({
        example: 'Example Title',
    }),
    description: z.string().openapi({
        example: 'Example description of the search result.',
    }),
}));
const googleSearchResponseSchemaWithImage = z.array(z.object({
    rank: z.number().openapi({
        example: 1,
    }),
    url: z.string().url().openapi({
        example: 'https://www.example.com',
    }),
    title: z.string().openapi({
        example: 'Example Title',
    }),
    description: z.string().openapi({
        example: 'Example description of the search result.',
    }),
    imageURL: z.string().url().openapi({
        example: 'https://www.example.com/image.jpg',
    }),
}));

// Google Web Search Endpoint
const google = (getBrowser: () => Promise<BrowserContext>) => {
    googleRouter.openapi(
        createRoute({
            method: 'get',
            path: '/search',
            request: {
                query: googleSearchSchema,
            },
            responses: {
                200: {
                    description: 'A list of search results',
                    content: {
                        'application/json': {
                            schema: googleSearchResponseSchema,
                        },
                    },
                },
            },
        }),
        async (c: Context) => {
            console.time('Google Web Search');
            const query = c.req.query('query');
            const browser = await getBrowser();
            const searchService = new SearchService(browser);
            const results = await searchService.executeSearch({
                provider: SearchProvider.Google,
                type: SearchType.Web,
                query: query!,
            });
            console.timeEnd('Google Web Search');
            return c.json(results);
        }
    );

    // Google Image Search Endpoint
    googleRouter.openapi(
        createRoute({
            method: 'get',
            path: '/image-search',
            request: {
                query: googleSearchSchema,
            },
            responses: {
                200: {
                    description: 'A list of image search results',
                    content: {
                        'application/json': {
                            schema: googleSearchResponseSchemaWithImage,
                        },
                    },
                },
            },
        }),
        async (c: any) => {
            console.time('Google Image Search');
            const { query } = c.req.valid()
            const browser = await getBrowser();
            const searchService = new SearchService(browser);
            const results = await searchService.executeSearch({
                provider: SearchProvider.Google,
                type: SearchType.Image,
                query: query.query,
            });
            console.timeEnd('Google Image Search');
            return c.json(results);
        }
    );

    return googleRouter;
}

export default google; 