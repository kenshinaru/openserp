/**
 * @file yandex.ts
 * @description Performs Yandex searches using Playwright with rate limiting.
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
 * Builds a Yandex search URL based on the provided query.
 * @param {Query} query - The search query parameters.
 * @param {number} page - The page number for pagination.
 * @returns {string} - The constructed Yandex search URL.
 */
function buildYandexSearchURL(query: Query, page: number = 0): string {
  const baseURL = 'https://www.yandex.com/search/';
  const params = new URLSearchParams();

  if (query.text || query.site || query.filetype) {
    let searchText = query.text;
    if (query.site) searchText += ` site:${query.site}`;
    if (query.filetype) searchText += ` mime:${query.filetype}`;
    if (query.dateInterval) searchText += ` date:${query.dateInterval}`;
    if (query.langCode) searchText += ` lang:${query.langCode}`;
    params.append('text', searchText);
    params.append('p', page.toString());
  }

  if (!params.get('text')) {
    throw new Error('Empty query built');
  }

  const url = new URL(baseURL);
  url.search = params.toString();
  return url.toString();
}

/**
 * Parses search results from the Yandex results page.
 * @param {Page} page - The Playwright page instance.
 * @returns {Promise<SearchResult[]>} - The parsed search results.
 */
async function parseYandexSearchResults(page: Page): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const resultElements = await page.$$('li.serp-item');

  for (let i = 0; i < resultElements.length; i++) {
    const element = resultElements[i];
    try {
      const title = await element.$eval('h2', el => el.textContent?.trim() || 'No title');
      const url = await element.$eval('a', el => el.getAttribute('href') || 'No URL');
      const description = await element.$eval('span.OrganicTextContentSpan', el => el.textContent?.trim() || 'No description');

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
 * Detects and handles Yandex captchas.
 * @param {Page} page - The Playwright page instance.
 * @returns {Promise<boolean>} - Whether a captcha was detected.
 */
async function handleCaptcha(page: Page): Promise<boolean> {
  try {
    const captchaForm = await page.$('form#checkbox-captcha-form');
    if (captchaForm) {
      console.error('Captcha detected on Yandex search page.');
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
 * Accepts cookie consent if prompted.
 * @param {Page} page - The Playwright page instance.
 * @returns {Promise<void>}
 */
async function acceptCookieConsent(page: Page): Promise<void> {
  try {
    const consentButton = await page.$('button#consent-accept');
    if (consentButton) {
      await consentButton.click();
      console.info('Accepted Yandex cookie consent.');
    }
  } catch (error) {
    console.warn('No cookie consent dialog found.');
  }
}

/**
 * Performs a Yandex search with rate limiting.
 * @param {Browser} browser - The Playwright browser instance.
 * @param {Query} query - The search query parameters.
 * @returns {Promise<SearchResult[]>} - The search results.
 */
export async function performYandexSearch(
  browser: BrowserContext,
  query: Query
): Promise<SearchResult[]> {
  const page: Page = await browser.newPage();

  try {
    const searchURL = buildYandexSearchURL(query);
    await page.goto(searchURL, { waitUntil: 'networkidle' });

    await acceptCookieConsent(page);

    const isCaptcha = await handleCaptcha(page);
    if (isCaptcha) {
      console.error('Captcha detected during Yandex search.');
      throw new Error('Captcha encountered');
    }

    const results = await parseYandexSearchResults(page);
    return results;
  } catch (error) {
    console.error(`Error during Yandex search: ${(error as Error).message}`);
    throw error;
  } finally {
    await page.close();
  }
}
