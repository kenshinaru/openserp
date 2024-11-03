import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { BrowserContext } from 'playwright';
import logger from '../utils/logger';

const screenshotRouter = new OpenAPIHono();

/**
 * Takes a full-page screenshot of the specified URL.
 * @param context - The browser context to use.
 * @param url - The URL of the page to capture.
 * @returns A buffer containing the screenshot image.
 */
async function takeFullPageScreenshot(context: BrowserContext, url: string): Promise<Buffer> {
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    const screenshot = await page.screenshot({ fullPage: true });
    await page.close();
    return screenshot;
}

// Define schema for query parameters
const screenshotQuerySchema = z.object({
    url: z.string().url().openapi({
        example: 'https://www.example.com',
    }),
});
const screenshot = (getBrowser: () => Promise<BrowserContext>) => {
// Screenshot Endpoint
screenshotRouter.openapi(
    createRoute({
        method: 'get',
        path: '/screenshot',
        request: {
            query: screenshotQuerySchema,
        },
        responses: {
            200: {
                description: 'A full-page screenshot of the specified URL',
                content: {
                    'image/png': {
                        schema: z.any(),
                    },
                },
            },
            400: {
                description: 'Bad Request - URL query parameter is required',
                content: {
                    'text/plain': {
                        schema: z.string(),
                    },
                },
            },
            500: {
                description: 'Internal Server Error - Failed to take screenshot',
                content: {
                    'text/plain': {
                        schema: z.string(),
                    },
                },
            },
        },
    }),
    async (c: any) => {
        const url = c.req.query('url');
        if (!url) {
            return c.text('URL query parameter is required', 400);
        }
        try {
            const browser = await getBrowser();
            const screenshot = await takeFullPageScreenshot(browser, url);
            return c.body(screenshot, 200, { 'Content-Type': 'image/png' });
        } catch (error) {
            logger.error(`Failed to take screenshot: ${(error as Error).message}`);
            return c.text('Failed to take screenshot', 500);
        }
    }
);

return screenshotRouter;
}


export default screenshot;