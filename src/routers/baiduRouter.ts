import { OpenAPIHono, createRoute, z } from 'npm:@hono/zod-openapi';
import { SearchService, SearchProvider, SearchType } from '../services/searchService.ts';
import { BrowserContext } from 'npm:playwright';

  const baiduRouter = new OpenAPIHono();

  // Define schemas for query parameters and responses
  const baiduSearchSchema = z.object({
    query: z.string().min(1).openapi({
      example: 'Baidu Search',
    }),
  });

  const baiduSearchResponseSchema = z.array(z.object({
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

  const baiduImageSearchResponseSchema = z.array(z.object({
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

  const baidu = (getBrowser: () => Promise<BrowserContext>) => {
    // Baidu Web Search Endpoint
    baiduRouter.openapi(
    createRoute({
      method: 'get',
      path: '/search',
      request: {
        query: baiduSearchSchema,
      },
      responses: {
        200: {
          description: 'A list of search results',
          content: {
            'application/json': {
              schema: baiduSearchResponseSchema,
            },
          },
        },
      },
    }),
    async (c: any) => {
      console.time('Baidu Web Search');
      const { query } = c.req.valid()
      const browser = await getBrowser();
      const searchService = new SearchService(browser);
      const results = await searchService.executeSearch({
        provider: SearchProvider.Baidu,
        type: SearchType.Web,
        query: query.query,
      });
      console.timeEnd('Baidu Web Search');
      return c.json(results);
      }
    );

    // Baidu Image Search Endpoint
  baiduRouter.openapi(
    createRoute({
      method: 'get',
      path: '/image-search',
      request: {
        query: baiduSearchSchema,
      },
      responses: {
        200: {
          description: 'A list of image search results',
          content: {
            'application/json': {
              schema: baiduImageSearchResponseSchema,
            },
          },
        },
      },
    }),
    async (c: any) => {
      console.time('Baidu Image Search');
      const { query } = c.req.valid()
      const browser = await getBrowser();
      const searchService = new SearchService(browser);
      const results = await searchService.executeSearch({
        provider: SearchProvider.Baidu,
        type: SearchType.Image,
        query: query.query,
      });
      console.timeEnd('Baidu Image Search');
      return c.json(results);
    }
  );

    return baiduRouter;
}

export default baidu; 