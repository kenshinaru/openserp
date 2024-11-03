
import { SearchResult as GoogleSearchResult } from './google.ts';
import { SearchResult as BaiduSearchResult } from './baidu.ts';
import { SearchResult as YandexSearchResult } from './yandex.ts';

export type SearchResult = GoogleSearchResult | BaiduSearchResult | YandexSearchResult;