var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/utils/logger.ts
import { createLogger, format, transports } from "winston";
var logger, logger_default;
var init_logger = __esm({
  "src/utils/logger.ts"() {
    "use strict";
    logger = createLogger({
      level: "info",
      format: format.combine(
        format.colorize(),
        format.timestamp({
          format: "YYYY-MM-DD HH:mm:ss"
        }),
        format.printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`)
      ),
      transports: [new transports.Console()]
    });
    logger_default = logger;
  }
});

// src/providers/google.ts
function buildSearchURL(query) {
  var _a;
  const domain = GoogleDomains[((_a = query.langCode) == null ? void 0 : _a.toLowerCase()) || ""] || "com";
  const baseURL = `https://www.google.${domain}/search`;
  const params = new URLSearchParams();
  if (query.text || query.site || query.filetype) {
    let searchText = query.text;
    if (query.site) searchText += ` site:${query.site}`;
    if (query.filetype) searchText += ` filetype:${query.filetype}`;
    params.append("q", searchText);
    params.append("oq", searchText);
  }
  if (query.dateInterval) {
    const [start, end] = query.dateInterval.split("..");
    params.append("tbs", `cdr:1,cd_min:${start},cd_max:${end}`);
  }
  if (query.limit) {
    params.append("num", query.limit.toString());
  }
  if (query.langCode) {
    params.append("hl", query.langCode);
    params.append("lr", `lang_${query.langCode.toLowerCase()}`);
  }
  params.append("pws", "0");
  params.append("nfpr", "1");
  const url = new URL(baseURL);
  url.search = params.toString();
  return url.toString();
}
function parseSearchResults(page) {
  return __async(this, null, function* () {
    const results = [];
    const resultElements = yield page.$$("div#search div.g");
    for (let i = 0; i < resultElements.length; i++) {
      const element = resultElements[i];
      try {
        const title = yield element.$eval("h3", (el) => {
          var _a;
          return ((_a = el.textContent) == null ? void 0 : _a.trim()) || "No title";
        });
        const url = yield element.$eval("a", (el) => el.getAttribute("href") || "No URL");
        const description = yield element.$eval(".VwiC3b", (el) => {
          var _a;
          return ((_a = el.textContent) == null ? void 0 : _a.trim()) || "No description";
        });
        if (url && url !== "#") {
          results.push({
            rank: i + 1,
            url,
            title,
            description
          });
        }
      } catch (error) {
        console.warn(`Failed to parse a search result: ${error.message}`);
        continue;
      }
    }
    console.info(`Parsed ${results.length} search results.`);
    return results;
  });
}
function handleCaptcha(page) {
  return __async(this, null, function* () {
    try {
      const captchaFrame = yield page.frame({ url: /https:\/\/www\.google\.com\/recaptcha\/api2\/anchor\?k=/ });
      if (captchaFrame) {
        console.error("Captcha detected on Google search page.");
        return true;
      }
      return false;
    } catch (error) {
      console.warn("Error while checking for captcha.");
      return false;
    }
  });
}
function acceptCookieConsent(page) {
  return __async(this, null, function* () {
    try {
      const consentButton = yield page.$('button[aria-label="Accept all"]');
      if (consentButton) {
        yield consentButton.click();
        console.info("Accepted cookie consent.");
      }
    } catch (error) {
      console.warn("No cookie consent dialog found.");
    }
  });
}
function performGoogleSearch(browser, query, acceptCookies = true) {
  return __async(this, null, function* () {
    const page = yield browser.newPage();
    try {
      const searchURL = buildSearchURL({ text: query, limit: 10, langCode: "en" });
      yield page.goto(searchURL, { waitUntil: "networkidle" });
      if (acceptCookies) {
        yield acceptCookieConsent(page);
      }
      const isCaptcha = yield handleCaptcha(page);
      if (isCaptcha) {
        console.error("Captcha detected during Google search.");
        throw new Error("Captcha encountered");
      }
      const results = yield parseSearchResults(page);
      return results;
    } catch (error) {
      console.error(`Error during Google search: ${error.message}`);
      throw error;
    } finally {
      yield page.close();
    }
  });
}
var GoogleDomains;
var init_google = __esm({
  "src/providers/google.ts"() {
    "use strict";
    GoogleDomains = {
      "": "com",
      "en": "com",
      "es": "com"
      // ... (Include all necessary mappings)
    };
  }
});

// src/providers/baidu.ts
function buildBaiduSearchURL(query) {
  const baseURL = "https://www.baidu.com/s";
  const params = new URLSearchParams();
  if (query.text || query.site || query.filetype) {
    let searchText = query.text;
    if (query.site) searchText += ` site:${query.site}`;
    if (query.filetype) searchText += ` filetype:${query.filetype}`;
    params.append("wd", searchText);
  }
  if (query.dateInterval) {
    const [start, end] = query.dateInterval.split("..");
    const ts1 = new Date(start).getTime() / 1e3;
    const ts2 = new Date(end).getTime() / 1e3;
    params.append("gpc", `stf=${ts1},${ts2}|stftype=2`);
  }
  if (query.limit) {
    params.append("rn", query.limit.toString());
  }
  params.append("f", "8");
  params.append("ie", "utf-8");
  const url = new URL(baseURL);
  url.search = params.toString();
  return url.toString();
}
function parseBaiduSearchResults(page) {
  return __async(this, null, function* () {
    const results = [];
    const resultElements = yield page.$$("div.c-container.new-pmd");
    for (let i = 0; i < resultElements.length; i++) {
      const element = resultElements[i];
      try {
        const title = yield element.$eval("a", (el) => {
          var _a;
          return ((_a = el.textContent) == null ? void 0 : _a.trim()) || "No title";
        });
        const url = yield element.$eval("a", (el) => el.getAttribute("href") || "No URL");
        const description = yield element.$eval(".c-abstract", (el) => {
          var _a;
          return ((_a = el.textContent) == null ? void 0 : _a.trim()) || "No description";
        });
        if (url && url !== "#") {
          results.push({
            rank: i + 1,
            url,
            title,
            description
          });
        }
      } catch (error) {
        console.warn(`Failed to parse a search result: ${error.message}`);
        continue;
      }
    }
    console.info(`Parsed ${results.length} search results.`);
    return results;
  });
}
function handleCaptcha2(page) {
  return __async(this, null, function* () {
    try {
      const captchaDialog = yield page.$("div.passMod_dialog-body");
      if (captchaDialog) {
        console.error("Captcha detected on Baidu search page.");
        return true;
      }
      return false;
    } catch (error) {
      console.warn("Error while checking for captcha.");
      return false;
    }
  });
}
function performBaiduSearch(browser, query) {
  return __async(this, null, function* () {
    const page = yield browser.newPage();
    try {
      const searchURL = buildBaiduSearchURL(query);
      yield page.goto(searchURL, { waitUntil: "networkidle" });
      const isCaptcha = yield handleCaptcha2(page);
      if (isCaptcha) {
        console.error("Captcha detected during Baidu search.");
        throw new Error("Captcha encountered");
      }
      const results = yield parseBaiduSearchResults(page);
      return results;
    } catch (error) {
      console.error(`Error during Baidu search: ${error.message}`);
      throw error;
    } finally {
      yield page.close();
    }
  });
}
var init_baidu = __esm({
  "src/providers/baidu.ts"() {
    "use strict";
  }
});

// src/providers/yandex.ts
function buildYandexSearchURL(query, page = 0) {
  const baseURL = "https://www.yandex.com/search/";
  const params = new URLSearchParams();
  if (query.text || query.site || query.filetype) {
    let searchText = query.text;
    if (query.site) searchText += ` site:${query.site}`;
    if (query.filetype) searchText += ` mime:${query.filetype}`;
    if (query.dateInterval) searchText += ` date:${query.dateInterval}`;
    if (query.langCode) searchText += ` lang:${query.langCode}`;
    params.append("text", searchText);
    params.append("p", page.toString());
  }
  if (!params.get("text")) {
    throw new Error("Empty query built");
  }
  const url = new URL(baseURL);
  url.search = params.toString();
  return url.toString();
}
function parseYandexSearchResults(page) {
  return __async(this, null, function* () {
    const results = [];
    const resultElements = yield page.$$("li.serp-item");
    for (let i = 0; i < resultElements.length; i++) {
      const element = resultElements[i];
      try {
        const title = yield element.$eval("h2", (el) => {
          var _a;
          return ((_a = el.textContent) == null ? void 0 : _a.trim()) || "No title";
        });
        const url = yield element.$eval("a", (el) => el.getAttribute("href") || "No URL");
        const description = yield element.$eval("span.OrganicTextContentSpan", (el) => {
          var _a;
          return ((_a = el.textContent) == null ? void 0 : _a.trim()) || "No description";
        });
        if (url && url !== "#") {
          results.push({
            rank: i + 1,
            url,
            title,
            description
          });
        }
      } catch (error) {
        console.warn(`Failed to parse a search result: ${error.message}`);
        continue;
      }
    }
    console.info(`Parsed ${results.length} search results.`);
    return results;
  });
}
function handleCaptcha3(page) {
  return __async(this, null, function* () {
    try {
      const captchaForm = yield page.$("form#checkbox-captcha-form");
      if (captchaForm) {
        console.error("Captcha detected on Yandex search page.");
        return true;
      }
      return false;
    } catch (error) {
      console.warn("Error while checking for captcha.");
      return false;
    }
  });
}
function acceptCookieConsent2(page) {
  return __async(this, null, function* () {
    try {
      const consentButton = yield page.$("button#consent-accept");
      if (consentButton) {
        yield consentButton.click();
        console.info("Accepted Yandex cookie consent.");
      }
    } catch (error) {
      console.warn("No cookie consent dialog found.");
    }
  });
}
function performYandexSearch(browser, query) {
  return __async(this, null, function* () {
    const page = yield browser.newPage();
    try {
      const searchURL = buildYandexSearchURL(query);
      yield page.goto(searchURL, { waitUntil: "networkidle" });
      yield acceptCookieConsent2(page);
      const isCaptcha = yield handleCaptcha3(page);
      if (isCaptcha) {
        console.error("Captcha detected during Yandex search.");
        throw new Error("Captcha encountered");
      }
      const results = yield parseYandexSearchResults(page);
      return results;
    } catch (error) {
      console.error(`Error during Yandex search: ${error.message}`);
      throw error;
    } finally {
      yield page.close();
    }
  });
}
var init_yandex = __esm({
  "src/providers/yandex.ts"() {
    "use strict";
  }
});

// src/services/searchService.ts
var SearchService;
var init_searchService = __esm({
  "src/services/searchService.ts"() {
    "use strict";
    init_google();
    init_baidu();
    init_yandex();
    SearchService = class {
      constructor(browser) {
        this.browser = browser;
      }
      /**
       * Executes a search based on the provided query parameters.
       * @param {SearchQuery} searchQuery - The search query parameters.
       * @returns {Promise<SearchResult[]>} - The search results.
       */
      executeSearch(searchQuery) {
        return __async(this, null, function* () {
          const { provider, type, query } = searchQuery;
          const searchType = type === "web" /* Web */ ? "Web" : "Image";
          console.time(`${provider} ${searchType} Search`);
          try {
            switch (provider) {
              case "google" /* Google */:
                return yield performGoogleSearch(this.browser, query);
              case "baidu" /* Baidu */:
                return yield performBaiduSearch(this.browser, { text: query });
              case "yandex" /* Yandex */:
                return yield performYandexSearch(this.browser, { text: query });
              default:
                throw new Error(`Unsupported search provider: ${provider}`);
            }
          } finally {
            console.timeEnd(`${provider} ${searchType} Search`);
          }
        });
      }
    };
  }
});

// src/routers/baiduRouter.ts
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
var baiduRouter, baiduSearchSchema, baiduSearchResponseSchema, baiduImageSearchResponseSchema, baidu, baiduRouter_default;
var init_baiduRouter = __esm({
  "src/routers/baiduRouter.ts"() {
    "use strict";
    init_searchService();
    baiduRouter = new OpenAPIHono();
    baiduSearchSchema = z.object({
      query: z.string().min(1).openapi({
        example: "Baidu Search"
      })
    });
    baiduSearchResponseSchema = z.array(z.object({
      rank: z.number().openapi({
        example: 1
      }),
      url: z.string().url().openapi({
        example: "https://www.example.com"
      }),
      title: z.string().openapi({
        example: "Example Title"
      }),
      description: z.string().openapi({
        example: "Example description of the search result."
      })
    }));
    baiduImageSearchResponseSchema = z.array(z.object({
      rank: z.number().openapi({
        example: 1
      }),
      url: z.string().url().openapi({
        example: "https://www.example.com"
      }),
      title: z.string().openapi({
        example: "Example Title"
      }),
      description: z.string().openapi({
        example: "Example description of the search result."
      }),
      imageURL: z.string().url().openapi({
        example: "https://www.example.com/image.jpg"
      })
    }));
    baidu = (getBrowser) => {
      baiduRouter.openapi(
        createRoute({
          method: "get",
          path: "/search",
          request: {
            query: baiduSearchSchema
          },
          responses: {
            200: {
              description: "A list of search results",
              content: {
                "application/json": {
                  schema: baiduSearchResponseSchema
                }
              }
            }
          }
        }),
        (c) => __async(void 0, null, function* () {
          console.time("Baidu Web Search");
          const { query } = c.req.valid();
          const browser = yield getBrowser();
          const searchService = new SearchService(browser);
          const results = yield searchService.executeSearch({
            provider: "baidu" /* Baidu */,
            type: "web" /* Web */,
            query: query.query
          });
          console.timeEnd("Baidu Web Search");
          return c.json(results);
        })
      );
      baiduRouter.openapi(
        createRoute({
          method: "get",
          path: "/image-search",
          request: {
            query: baiduSearchSchema
          },
          responses: {
            200: {
              description: "A list of image search results",
              content: {
                "application/json": {
                  schema: baiduImageSearchResponseSchema
                }
              }
            }
          }
        }),
        (c) => __async(void 0, null, function* () {
          console.time("Baidu Image Search");
          const { query } = c.req.valid();
          const browser = yield getBrowser();
          const searchService = new SearchService(browser);
          const results = yield searchService.executeSearch({
            provider: "baidu" /* Baidu */,
            type: "image" /* Image */,
            query: query.query
          });
          console.timeEnd("Baidu Image Search");
          return c.json(results);
        })
      );
      return baiduRouter;
    };
    baiduRouter_default = baidu;
  }
});

// src/routers/yandexRouter.ts
import { OpenAPIHono as OpenAPIHono2, createRoute as createRoute2, z as z2 } from "@hono/zod-openapi";
var yandexRouter, yandexSearchSchema, yandexSearchResponseSchema, yandexImageSearchResponseSchema, yandex, yandexRouter_default;
var init_yandexRouter = __esm({
  "src/routers/yandexRouter.ts"() {
    "use strict";
    init_searchService();
    yandexRouter = new OpenAPIHono2();
    yandexSearchSchema = z2.object({
      query: z2.string().min(1).openapi({
        example: "Yandex Search"
      })
    });
    yandexSearchResponseSchema = z2.array(z2.object({
      rank: z2.number().openapi({
        example: 1
      }),
      url: z2.string().url().openapi({
        example: "https://www.example.com"
      }),
      title: z2.string().openapi({
        example: "Example Title"
      }),
      description: z2.string().openapi({
        example: "Example description of the search result."
      })
    }));
    yandexImageSearchResponseSchema = z2.array(z2.object({
      rank: z2.number().openapi({
        example: 1
      }),
      url: z2.string().url().openapi({
        example: "https://www.example.com"
      }),
      title: z2.string().openapi({
        example: "Example Title"
      }),
      description: z2.string().openapi({
        example: "Example description of the search result."
      }),
      imageURL: z2.string().url().openapi({
        example: "https://www.example.com/image.jpg"
      })
    }));
    yandex = (getBrowser) => {
      yandexRouter.openapi(
        createRoute2({
          method: "get",
          path: "/search",
          request: {
            query: yandexSearchSchema
          },
          responses: {
            200: {
              description: "A list of search results",
              content: {
                "application/json": {
                  schema: yandexSearchResponseSchema
                }
              }
            }
          }
        }),
        (c) => __async(void 0, null, function* () {
          console.time("Yandex Web Search");
          const { query } = c.req.valid();
          const browser = yield getBrowser();
          const searchService = new SearchService(browser);
          const results = yield searchService.executeSearch({
            provider: "yandex" /* Yandex */,
            type: "web" /* Web */,
            query: query.query
          });
          console.timeEnd("Yandex Web Search");
          return c.json(results);
        })
      );
      yandexRouter.openapi(
        createRoute2({
          method: "get",
          path: "/image-search",
          request: {
            query: yandexSearchSchema
          },
          responses: {
            200: {
              description: "A list of image search results",
              content: {
                "application/json": {
                  schema: yandexImageSearchResponseSchema
                }
              }
            }
          }
        }),
        (c) => __async(void 0, null, function* () {
          console.time("Yandex Image Search");
          const { query } = c.req.valid();
          const browser = yield getBrowser();
          const searchService = new SearchService(browser);
          const results = yield searchService.executeSearch({
            provider: "yandex" /* Yandex */,
            type: "image" /* Image */,
            query: query.query
          });
          console.timeEnd("Yandex Image Search");
          return c.json(results);
        })
      );
      return yandexRouter;
    };
    yandexRouter_default = yandex;
  }
});

// src/routers/googleRouter.ts
import { OpenAPIHono as OpenAPIHono3, createRoute as createRoute3, z as z3 } from "@hono/zod-openapi";
var googleRouter, googleSearchSchema, googleSearchResponseSchema, googleSearchResponseSchemaWithImage, google, googleRouter_default;
var init_googleRouter = __esm({
  "src/routers/googleRouter.ts"() {
    "use strict";
    init_searchService();
    googleRouter = new OpenAPIHono3();
    googleSearchSchema = z3.object({
      query: z3.string().min(1).openapi({
        example: "OpenAI"
      })
    });
    googleSearchResponseSchema = z3.array(z3.object({
      rank: z3.number().openapi({
        example: 1
      }),
      url: z3.string().url().openapi({
        example: "https://www.example.com"
      }),
      title: z3.string().openapi({
        example: "Example Title"
      }),
      description: z3.string().openapi({
        example: "Example description of the search result."
      })
    }));
    googleSearchResponseSchemaWithImage = z3.array(z3.object({
      rank: z3.number().openapi({
        example: 1
      }),
      url: z3.string().url().openapi({
        example: "https://www.example.com"
      }),
      title: z3.string().openapi({
        example: "Example Title"
      }),
      description: z3.string().openapi({
        example: "Example description of the search result."
      }),
      imageURL: z3.string().url().openapi({
        example: "https://www.example.com/image.jpg"
      })
    }));
    google = (getBrowser) => {
      googleRouter.openapi(
        createRoute3({
          method: "get",
          path: "/search",
          request: {
            query: googleSearchSchema
          },
          responses: {
            200: {
              description: "A list of search results",
              content: {
                "application/json": {
                  schema: googleSearchResponseSchema
                }
              }
            }
          }
        }),
        (c) => __async(void 0, null, function* () {
          console.time("Google Web Search");
          const query = c.req.query("query");
          const browser = yield getBrowser();
          const searchService = new SearchService(browser);
          const results = yield searchService.executeSearch({
            provider: "google" /* Google */,
            type: "web" /* Web */,
            query
          });
          console.timeEnd("Google Web Search");
          return c.json(results);
        })
      );
      googleRouter.openapi(
        createRoute3({
          method: "get",
          path: "/image-search",
          request: {
            query: googleSearchSchema
          },
          responses: {
            200: {
              description: "A list of image search results",
              content: {
                "application/json": {
                  schema: googleSearchResponseSchemaWithImage
                }
              }
            }
          }
        }),
        (c) => __async(void 0, null, function* () {
          console.time("Google Image Search");
          const { query } = c.req.valid();
          const browser = yield getBrowser();
          const searchService = new SearchService(browser);
          const results = yield searchService.executeSearch({
            provider: "google" /* Google */,
            type: "image" /* Image */,
            query: query.query
          });
          console.timeEnd("Google Image Search");
          return c.json(results);
        })
      );
      return googleRouter;
    };
    googleRouter_default = google;
  }
});

// src/routers/screenshotRouter.ts
import { OpenAPIHono as OpenAPIHono4, createRoute as createRoute4, z as z4 } from "@hono/zod-openapi";
function takeFullPageScreenshot(context, url) {
  return __async(this, null, function* () {
    const page = yield context.newPage();
    yield page.goto(url, { waitUntil: "networkidle" });
    const screenshot2 = yield page.screenshot({ fullPage: true });
    yield page.close();
    return screenshot2;
  });
}
var screenshotRouter, screenshotQuerySchema, screenshot, screenshotRouter_default;
var init_screenshotRouter = __esm({
  "src/routers/screenshotRouter.ts"() {
    "use strict";
    init_logger();
    screenshotRouter = new OpenAPIHono4();
    screenshotQuerySchema = z4.object({
      url: z4.string().url().openapi({
        example: "https://www.example.com"
      })
    });
    screenshot = (getBrowser) => {
      screenshotRouter.openapi(
        createRoute4({
          method: "get",
          path: "/screenshot",
          request: {
            query: screenshotQuerySchema
          },
          responses: {
            200: {
              description: "A full-page screenshot of the specified URL",
              content: {
                "image/png": {
                  schema: z4.any()
                }
              }
            },
            400: {
              description: "Bad Request - URL query parameter is required",
              content: {
                "text/plain": {
                  schema: z4.string()
                }
              }
            },
            500: {
              description: "Internal Server Error - Failed to take screenshot",
              content: {
                "text/plain": {
                  schema: z4.string()
                }
              }
            }
          }
        }),
        (c) => __async(void 0, null, function* () {
          const url = c.req.query("url");
          if (!url) {
            return c.text("URL query parameter is required", 400);
          }
          try {
            const browser = yield getBrowser();
            const screenshot2 = yield takeFullPageScreenshot(browser, url);
            return c.body(screenshot2, 200, { "Content-Type": "image/png" });
          } catch (error) {
            logger_default.error(`Failed to take screenshot: ${error.message}`);
            return c.text("Failed to take screenshot", 500);
          }
        })
      );
      return screenshotRouter;
    };
    screenshotRouter_default = screenshot;
  }
});

// src/index.ts
import { firefox } from "playwright";
import dotenv from "dotenv";
import path from "path";
import { serve } from "@hono/node-server";
import { OpenAPIHono as OpenAPIHono5 } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
var require_src = __commonJS({
  "src/index.ts"(exports) {
    init_logger();
    init_baiduRouter();
    init_yandexRouter();
    init_googleRouter();
    init_screenshotRouter();
    var browser;
    dotenv.config();
    function initializeBrowser() {
      return __async(this, null, function* () {
        if (!browser) {
          browser = yield firefox.launchPersistentContext(path.resolve(__dirname, "../", "user-data-dir"), {
            headless: true,
            args: [
              "--no-remote",
              "--new-instance",
              "--disable-gpu",
              "--disable-extensions-except=" + path.resolve(__dirname, "../", "ublock.xpi"),
              "--load-extension=" + path.resolve(__dirname, "../", "ublock.xpi")
            ]
          });
        }
        return browser;
      });
    }
    (() => __async(exports, null, function* () {
      try {
        browser = yield initializeBrowser();
        logger_default.info("Browser initialized successfully.");
      } catch (error) {
        logger_default.error(`Failed to initialize browser: ${error.message}`);
        process.exit(1);
      }
    }))();
    var getBrowser = () => __async(exports, null, function* () {
      if (!browser) {
        browser = yield initializeBrowser();
      }
      return browser;
    });
    var app = new OpenAPIHono5();
    app.route("/google", googleRouter_default(getBrowser));
    app.route("/baidu", baiduRouter_default(getBrowser));
    app.route("/yandex", yandexRouter_default(getBrowser));
    app.route("/screenshot", screenshotRouter_default(getBrowser));
    app.get("/", (c) => c.text("Hello, Hono!"));
    app.get("/ui", swaggerUI({ url: "/doc" }));
    app.doc("/doc.json", {
      openapi: "3.0.0",
      info: {
        title: "Search API",
        version: "1.0.0",
        description: "API for performing web and image searches across multiple providers"
      },
      servers: [
        {
          url: "http://localhost:3000"
        }
      ]
    });
    app.get("/doc", (c) => __async(exports, null, function* () {
      const content = yield fetch("http://localhost:3000/doc.json");
      const data = yield content.json();
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
    }));
    serve(app, (info) => {
      console.log(`Listening on http://localhost:${info.port}`);
    });
  }
});
export default require_src();
//# sourceMappingURL=index.mjs.map