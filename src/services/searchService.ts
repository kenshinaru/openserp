import {  BrowserContext } from 'npm:playwright';
import { performGoogleSearch, SearchResult } from '../providers/google.ts';
import { performBaiduSearch } from '../providers/baidu.ts';
import { performYandexSearch } from '../providers/yandex.ts';

/**
 * Enum for supported search providers.
 */
export enum SearchProvider {
    Google = 'google',
    Baidu = 'baidu',
    Yandex = 'yandex',
}

/**
 * Enum for search types.
 */
export enum SearchType {
    Web = 'web',
    Image = 'image',
}

/**
 * Interface representing a search query.
 */
interface SearchQuery {
    provider: SearchProvider;
    type: SearchType;
    query: string;
}

/**
 * Service to perform searches across different providers.
 */
export class SearchService {
    private browser: BrowserContext;

    constructor(browser: BrowserContext) {
        this.browser = browser;
    }

    /**
     * Executes a search based on the provided query parameters.
     * @param {SearchQuery} searchQuery - The search query parameters.
     * @returns {Promise<SearchResult[]>} - The search results.
     */
    async executeSearch(searchQuery: SearchQuery): Promise<SearchResult[]> {
        const { provider, type, query } = searchQuery;
        const searchType = type === SearchType.Web ? 'Web' : 'Image';
        console.time(`${provider} ${searchType} Search`);

        try {
            switch (provider) {
                case SearchProvider.Google:
                    return await performGoogleSearch(this.browser, query);
                case SearchProvider.Baidu:
                    return await performBaiduSearch(this.browser, { text: query });
                case SearchProvider.Yandex:
                    return await performYandexSearch(this.browser, { text: query });
                default:
                    throw new Error(`Unsupported search provider: ${provider}`);
            }
        } finally {
            console.timeEnd(`${provider} ${searchType} Search`);
        }
    }
} 