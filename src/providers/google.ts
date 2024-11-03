/**
 * @file google.ts
 * @description Performs Google searches using Playwright with rate limiting.
 */

import { Browser, Page, BrowserContext } from 'playwright';

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
 * Maps language codes to their respective Google domains.
 */
const GoogleDomains: Record<string, string> = {
  "": "com",
  "en": "com",
  "es": "com",
  // ... (Include all necessary mappings)
};

/**
 * Builds a Google search URL based on the provided query.
 * @param {Query} query - The search query parameters.
 * @returns {string} - The constructed Google search URL.
 */
function buildSearchURL(query: Query): string {
  const domain = GoogleDomains[query.langCode?.toLowerCase() || ""] || "com";
  const baseURL = `https://www.google.${domain}/search`;
  const params = new URLSearchParams();

  if (query.text || query.site || query.filetype) {
    let searchText = query.text;
    if (query.site) searchText += ` site:${query.site}`;
    if (query.filetype) searchText += ` filetype:${query.filetype}`;
    params.append('q', searchText);
    params.append('oq', searchText);
  }

  if (query.dateInterval) {
    const [start, end] = query.dateInterval.split('..');
    params.append('tbs', `cdr:1,cd_min:${start},cd_max:${end}`);
  }

  if (query.limit) {
    params.append('num', query.limit.toString());
  }

  if (query.langCode) {
    params.append('hl', query.langCode);
    params.append('lr', `lang_${query.langCode.toLowerCase()}`);
  }

  params.append('pws', '0'); // Disable personalized search
  params.append('nfpr', '1'); // Disable auto correction

  const url = new URL(baseURL);
  url.search = params.toString();
  return url.toString();
}

/**
 * Parses search results from the Google results page.
 * @param {Page} page - The Playwright page instance.
 * @returns {Promise<SearchResult[]>} - The parsed search results.
 */
async function parseSearchResults(page: Page): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const resultElements = await page.$$('div#search div.g');

  for (let i = 0; i < resultElements.length; i++) {
    const element = resultElements[i];
    try {
      const title = await element.$eval('h3', el => el.textContent?.trim() || 'No title');
      const url = await element.$eval('a', el => el.getAttribute('href') || 'No URL');
      const description = await element.$eval('.VwiC3b', el => el.textContent?.trim() || 'No description');

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
 * Detects and handles Google captchas.
 * @param {Page} page - The Playwright page instance.
 * @returns {Promise<boolean>} - Whether a captcha was detected.
 */
async function handleCaptcha(page: Page): Promise<boolean> {
  try {
    const captchaFrame = await page.frame({ url: /https:\/\/www\.google\.com\/recaptcha\/api2\/anchor\?k=/ });
    if (captchaFrame) {
      console.error('Captcha detected on Google search page.');
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
    const consentButton = await page.$('button[aria-label="Accept all"]');
    if (consentButton) {
      await consentButton.click();
      console.info('Accepted cookie consent.');
    }
  } catch (error) {
    console.warn('No cookie consent dialog found.');
  }
}

/**
 * Performs a Google search with rate limiting.
 * @param {Browser} browser - The Playwright browser instance.
 * @param {string} query - The search query.
 * @param {boolean} acceptCookies - Whether to accept cookies.
 * @returns {Promise<SearchResult[]>} - The search results.
 */
export async function performGoogleSearch(
  browser: BrowserContext,
  query: string,
  acceptCookies: boolean = true
): Promise<SearchResult[]> {
  const page: Page = await browser.newPage();
  
  try {
    const searchURL = buildSearchURL({ text: query, limit: 10, langCode: 'en' });
    await page.goto(searchURL, { waitUntil: 'networkidle' });

    if (acceptCookies) {
      await acceptCookieConsent(page);
    }

    const isCaptcha = await handleCaptcha(page);
    if (isCaptcha) {
      console.error('Captcha detected during Google search.');
      throw new Error('Captcha encountered');
    }

    const results = await parseSearchResults(page);
    return results;
  } catch (error) {
    console.error(`Error during Google search: ${(error as Error).message}`);
    throw error;
  } finally {
    await page.close();
  }
}
