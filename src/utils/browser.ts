/**
 * @file browser.ts
 * @description Handles browser initialization and ensures a single instance is used.
 */

import { firefox, Browser } from 'playwright';
import logger from './logger';

let browser: Browser | null = null;

/**
 * Initializes the Playwright browser if not already initialized.
 * @returns {Promise<Browser>} - The browser instance.
 */
export async function initializeBrowser(): Promise<Browser> {
    if (!browser) {
        try {
            browser = await firefox.launch({
                headless: true,
                args: [
                    '--no-remote',
                    '--new-instance',
                    '--disable-gpu',
                ],
            });
            logger.info('Playwright browser launched.');
        } catch (error) {
            logger.error(`Failed to launch browser: ${(error as Error).message}`);
            throw error;
        }
    }
    return browser;
} 