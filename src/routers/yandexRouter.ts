import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { SearchService, SearchProvider, SearchType } from '../services/searchService';
import { BrowserContext } from 'playwright';

const yandexRouter = new OpenAPIHono();

// Define schemas for query parameters and responses
const yandexSearchSchema = z.object({
  query: z.string().min(1).openapi({
    example: 'Yandex Search',
  }),
});

const yandexSearchResponseSchema = z.array(z.object({
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

const yandexImageSearchResponseSchema = z.array(z.object({
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
const yandex = (getBrowser: () => Promise<BrowserContext>) => {
// Yandex Web Search Endpoint
yandexRouter.openapi(
  createRoute({
    method: 'get',
    path: '/search',
    request: {
      query: yandexSearchSchema,
    },
    responses: {
      200: {
        description: 'A list of search results',
        content: {
          'application/json': {
            schema: yandexSearchResponseSchema,
          },
        },
      },
    },
  }),
  async (c: any) => {
    console.time('Yandex Web Search');
    const { query } = c.req.valid()
    const browser = await getBrowser();
    const searchService = new SearchService(browser);
    const results = await searchService.executeSearch({
      provider: SearchProvider.Yandex,
      type: SearchType.Web,
      query: query.query,
    });
    console.timeEnd('Yandex Web Search');
    return c.json(results);
  }
);

// Yandex Image Search Endpoint
yandexRouter.openapi(
  createRoute({
    method: 'get',
    path: '/image-search',
    request: {
      query: yandexSearchSchema,
    },
    responses: {
      200: {
        description: 'A list of image search results',
        content: {
          'application/json': {
            schema: yandexImageSearchResponseSchema,
          },
        },
      },
    },
  }),
  async (c: any) => {
    console.time('Yandex Image Search');
    const { query } = c.req.valid();
    const browser = await getBrowser();
    const searchService = new SearchService(browser);
    const results = await searchService.executeSearch({
      provider: SearchProvider.Yandex,
      type: SearchType.Image,
      query: query.query,
    });
    console.timeEnd('Yandex Image Search');
    return c.json(results);
  }
    );

    return yandexRouter;
}

export default yandex; 