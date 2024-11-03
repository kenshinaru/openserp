/**
 * @file rateLimiter.ts
 * @description Implements rate limiting to control the frequency of search requests.
 */

import { RateLimiter } from 'limiter';
import dotenv from 'dotenv';
import { SearchProvider } from '../services/searchService';

dotenv.config();

/**
 * Initializes a rate limiter based on the provider.
 * @param {SearchProvider} provider - The search provider.
 * @returns {RateLimiter} - The rate limiter instance.
 */
export function createRateLimiter(provider: SearchProvider): RateLimiter {
    let tokens: number;
    let interval: number; // in milliseconds

    switch (provider) {
        case SearchProvider.Google:
            tokens = parseInt(process.env.GOOGLE_RATE_LIMIT_TOKENS || '1', 10);
            interval = parseInt(process.env.GOOGLE_RATE_LIMIT_INTERVAL || '5', 10) * 1000;
            break;
        case SearchProvider.Baidu:
            tokens = parseInt(process.env.BAIDU_RATE_LIMIT_TOKENS || '1', 10);
            interval = parseInt(process.env.BAIDU_RATE_LIMIT_INTERVAL || '5', 10) * 1000;
            break;
        case SearchProvider.Yandex:
            tokens = parseInt(process.env.YANDEX_RATE_LIMIT_TOKENS || '1', 10);
            interval = parseInt(process.env.YANDEX_RATE_LIMIT_INTERVAL || '5', 10) * 1000;
            break;
        default:
            tokens = 1;
            interval = 5000;
    }

    return new RateLimiter({ tokensPerInterval: tokens, interval });
} 