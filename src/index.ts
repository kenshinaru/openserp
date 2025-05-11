/**
 * @file index.ts
 * @description Initializes a Playwright instance using Firefox to perform Google searches and serves an API with Swagger documentation.
 */

import { firefox, Browser, BrowserContext } from 'npm:playwright';
import { performGoogleSearch } from './providers/google.ts';
import logger from './utils/logger.ts';
import dotenv from 'npm:dotenv';
import path from 'node:path';
import { serve } from 'npm:@hono/node-server';
import { OpenAPIHono } from 'npm:@hono/zod-openapi';
import { swaggerUI } from 'npm:@hono/swagger-ui';
import baidu from './routers/baiduRouter.ts';
import yandex from './routers/yandexRouter.ts';
import google from './routers/googleRouter.ts';
import screenshot from './routers/screenshotRouter.ts';
const __dirname = path.resolve(import.meta.dirname);
let _browser: Browser;
let browser: BrowserContext;
dotenv.config();

interface SearchResult {
  rank: number;
  url: string;
  title: string;
  description: string;
}

async function initializeBrowser(): Promise<BrowserContext> {
    if (!browser) {
       browser = await firefox.launchPersistentContext(path.resolve(__dirname, '../', 'user-data-dir'), {
            headless: true,
            args: [
                '--no-remote',
                '--new-instance',
                '--disable-gpu',
                '--disable-extensions-except='+path.resolve(__dirname, '../', 'ublock.xpi'),
                '--load-extension='+path.resolve(__dirname, '../', 'ublock.xpi'),
            ],
        });
    }
    return browser;
}
// Initialize the browser at the start of the script
(async () => {
  try {
    browser = await initializeBrowser();
    logger.info('Browser initialized successfully.');
  } catch (error) {
    logger.error(`Failed to initialize browser: ${(error as Error).message}`);
    process.exit(1); // Exit the process if the browser fails to initialize
  }
})();

const getBrowser = async () => {
  if (!browser) {
    browser = await initializeBrowser();
  }
  return browser;
}

const app = new OpenAPIHono<{ Bindings: any }>();

// Pass the initialized browser to the routers
app.route('/google', google(getBrowser));
app.route('/baidu', baidu(getBrowser));
app.route('/yandex', yandex(getBrowser));
app.route('/screenshot', screenshot(getBrowser));

app.get('/', (c) => c.text('Hello, Hono!'));

app.get('/ui', swaggerUI({ url: '/doc' }));

app.doc('/doc.json', {
    openapi: '3.0.0',
    info: {
        title: 'Search API',
        version: '1.0.0',
        description: 'API for performing web and image searches across multiple providers',
    },
    servers: [
        {
            url: 'http://localhost:7860',
        },
    ],
});

app.get('/doc', async (c) => {
    const content = await fetch('http://localhost:7860/doc.json');
    const data = await content.json();
    console.log(data);
    return c.html(`
        <!doctype html>
<html>
  <head>
    <title>Scalar API Reference</title>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <script
      id="api-reference"
      data-url="/doc.json"></script>

//     <!-- Optional: You can set a full configuration object like this: -->
//         <script
//   id="api-reference"
//   type="application/json">
//   ${JSON.stringify(data, null, 2)}
// </script>
<script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>
        
        `);
});

Deno.serve({ port: 7860 }, app.fetch) 
// serve(app, (info) => {
//     console.log(`Listening on http://localhost:${info.port}`);
// }); 
