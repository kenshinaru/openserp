/**
 * @file baidu.ts
 * @description Performs Baidu searches using Playwright with rate limiting.
 */

import { BrowserContext, Page } from 'npm:playwright';

/**
 * Represents a search query.
 */
export interface Query {
  text: string;
  site?: string;
  filetype?: string;
  dateInterval?: string;
  langCode?: string;
  limit?: number;
}

/**
 * Represents a search result.
 */
export interface SearchResult {
  rank: number;
  url: string;
  title: string;
  description: string;
}

/**
 * Builds a Baidu search URL based on the provided query.
 * @param {Query} query - The search query parameters.
 * @returns {string} - The constructed Baidu search URL.
 */
function buildBaiduSearchURL(query: Query): string {
  const baseURL = 'https://www.baidu.com/s';
  const params = new URLSearchParams();

  if (query.text || query.site || query.filetype) {
    let searchText = query.text;
    if (query.site) searchText += ` site:${query.site}`;
    if (query.filetype) searchText += ` filetype:${query.filetype}`;
    params.append('wd', searchText);
  }

  if (query.dateInterval) {
    const [start, end] = query.dateInterval.split('..');
    const ts1 = new Date(start).getTime() / 1000;
    const ts2 = new Date(end).getTime() / 1000;
    params.append('gpc', `stf=${ts1},${ts2}|stftype=2`);
  }

  if (query.limit) {
    params.append('rn', query.limit.toString());
  }

  params.append('f', '8');
  params.append('ie', 'utf-8');

  const url = new URL(baseURL);
  url.search = params.toString();
  return url.toString();
}

/**
 * Parses search results from the Baidu results page.
 * @param {Page} page - The Playwright page instance.
 * @returns {Promise<SearchResult[]>} - The parsed search results.
 */
async function parseBaiduSearchResults(page: Page): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const resultElements = await page.$$('div.c-container.new-pmd');

  for (let i = 0; i < resultElements.length; i++) {
    const element = resultElements[i];
    try {
      const title = await element.$eval('a', el => el.textContent?.trim() || 'No title');
      const url = await element.$eval('a', el => el.getAttribute('href') || 'No URL');
      const description = await element.$eval('.c-abstract', el => el.textContent?.trim() || 'No description');

      if (url && url !== '#') {
        results.push({
          rank: i + 1,
          url,
          title,
          description,
        });
      }
    } catch (error) {
      console.warn(`Failed to parse a search result: ${(error as Error).message}`);
      continue;
    }
  }

  console.info(`Parsed ${results.length} search results.`);
  return results;
}

/**
 * Detects and handles Baidu captchas.
 * @param {Page} page - The Playwright page instance.
 * @returns {Promise<boolean>} - Whether a captcha was detected.
 */
async function handleCaptcha(page: Page): Promise<boolean> {
  try {
    const captchaDialog = await page.$('div.passMod_dialog-body');
    if (captchaDialog) {
      console.error('Captcha detected on Baidu search page.');
      // Implement captcha solving logic or notify the user
      return true;
    }
    return false;
  } catch (error) {
    console.warn('Error while checking for captcha.');
    return false;
  }
}

/**
 * Performs a Baidu search.
 * @param {Browser} browser - The Playwright browser instance.
 * @param {Query} query - The search query parameters.
 * @returns {Promise<SearchResult[]>} - The search results.
 */
export async function performBaiduSearch(
  browser: BrowserContext,
  query: Query
): Promise<SearchResult[]> {
  const page: Page = await browser.newPage();

  try {
    const searchURL = buildBaiduSearchURL(query);
    await page.goto(searchURL, { waitUntil: 'networkidle' });

    const isCaptcha = await handleCaptcha(page);
    if (isCaptcha) {
      console.error('Captcha detected during Baidu search.');
      throw new Error('Captcha encountered');
    }

    const results = await parseBaiduSearchResults(page);
    return results;
  } catch (error) {
    console.error(`Error during Baidu search: ${(error as Error).message}`);
    throw error;
  } finally {
    await page.close();
  }
}
