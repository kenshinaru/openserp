
import { SearchResult as GoogleSearchResult } from './google';
import { SearchResult as BaiduSearchResult } from './baidu';
import { SearchResult as YandexSearchResult } from './yandex';

export type SearchResult = GoogleSearchResult | BaiduSearchResult | YandexSearchResult;