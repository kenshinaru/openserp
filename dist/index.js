"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
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

// src/index.ts
var import_playwright = require("playwright");

// src/utils/logger.ts
var import_winston = require("winston");
var logger = (0, import_winston.createLogger)({
  level: "info",
  format: import_winston.format.combine(
    import_winston.format.colorize(),
    import_winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss"
    }),
    import_winston.format.printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`)
  ),
  transports: [new import_winston.transports.Console()]
});
var logger_default = logger;

// src/index.ts
var import_dotenv = __toESM(require("dotenv"));
var import_path = __toESM(require("path"));
var import_node_server = require("@hono/node-server");
var import_zod_openapi5 = require("@hono/zod-openapi");
var import_swagger_ui = require("@hono/swagger-ui");

// src/routers/baiduRouter.ts
var import_zod_openapi = require("@hono/zod-openapi");

// src/providers/google.ts
var GoogleDomains = {
  "": "com",
  "en": "com",
  "es": "com"
  // ... (Include all necessary mappings)
};
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
function performGoogleSearch(browser2, query, acceptCookies = true) {
  return __async(this, null, function* () {
    const page = yield browser2.newPage();
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
function performBaiduSearch(browser2, query) {
  return __async(this, null, function* () {
    const page = yield browser2.newPage();
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
function performYandexSearch(browser2, query) {
  return __async(this, null, function* () {
    const page = yield browser2.newPage();
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

// src/services/searchService.ts
var SearchService = class {
  constructor(browser2) {
    this.browser = browser2;
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

// src/routers/baiduRouter.ts
var baiduRouter = new import_zod_openapi.OpenAPIHono();
var baiduSearchSchema = import_zod_openapi.z.object({
  query: import_zod_openapi.z.string().min(1).openapi({
    example: "Baidu Search"
  })
});
var baiduSearchResponseSchema = import_zod_openapi.z.array(import_zod_openapi.z.object({
  rank: import_zod_openapi.z.number().openapi({
    example: 1
  }),
  url: import_zod_openapi.z.string().url().openapi({
    example: "https://www.example.com"
  }),
  title: import_zod_openapi.z.string().openapi({
    example: "Example Title"
  }),
  description: import_zod_openapi.z.string().openapi({
    example: "Example description of the search result."
  })
}));
var baiduImageSearchResponseSchema = import_zod_openapi.z.array(import_zod_openapi.z.object({
  rank: import_zod_openapi.z.number().openapi({
    example: 1
  }),
  url: import_zod_openapi.z.string().url().openapi({
    example: "https://www.example.com"
  }),
  title: import_zod_openapi.z.string().openapi({
    example: "Example Title"
  }),
  description: import_zod_openapi.z.string().openapi({
    example: "Example description of the search result."
  }),
  imageURL: import_zod_openapi.z.string().url().openapi({
    example: "https://www.example.com/image.jpg"
  })
}));
var baidu = (getBrowser2) => {
  baiduRouter.openapi(
    (0, import_zod_openapi.createRoute)({
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
      const browser2 = yield getBrowser2();
      const searchService = new SearchService(browser2);
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
    (0, import_zod_openapi.createRoute)({
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
      const browser2 = yield getBrowser2();
      const searchService = new SearchService(browser2);
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
var baiduRouter_default = baidu;

// src/routers/yandexRouter.ts
var import_zod_openapi2 = require("@hono/zod-openapi");
var yandexRouter = new import_zod_openapi2.OpenAPIHono();
var yandexSearchSchema = import_zod_openapi2.z.object({
  query: import_zod_openapi2.z.string().min(1).openapi({
    example: "Yandex Search"
  })
});
var yandexSearchResponseSchema = import_zod_openapi2.z.array(import_zod_openapi2.z.object({
  rank: import_zod_openapi2.z.number().openapi({
    example: 1
  }),
  url: import_zod_openapi2.z.string().url().openapi({
    example: "https://www.example.com"
  }),
  title: import_zod_openapi2.z.string().openapi({
    example: "Example Title"
  }),
  description: import_zod_openapi2.z.string().openapi({
    example: "Example description of the search result."
  })
}));
var yandexImageSearchResponseSchema = import_zod_openapi2.z.array(import_zod_openapi2.z.object({
  rank: import_zod_openapi2.z.number().openapi({
    example: 1
  }),
  url: import_zod_openapi2.z.string().url().openapi({
    example: "https://www.example.com"
  }),
  title: import_zod_openapi2.z.string().openapi({
    example: "Example Title"
  }),
  description: import_zod_openapi2.z.string().openapi({
    example: "Example description of the search result."
  }),
  imageURL: import_zod_openapi2.z.string().url().openapi({
    example: "https://www.example.com/image.jpg"
  })
}));
var yandex = (getBrowser2) => {
  yandexRouter.openapi(
    (0, import_zod_openapi2.createRoute)({
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
      const browser2 = yield getBrowser2();
      const searchService = new SearchService(browser2);
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
    (0, import_zod_openapi2.createRoute)({
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
      const browser2 = yield getBrowser2();
      const searchService = new SearchService(browser2);
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
var yandexRouter_default = yandex;

// src/routers/googleRouter.ts
var import_zod_openapi3 = require("@hono/zod-openapi");
var googleRouter = new import_zod_openapi3.OpenAPIHono();
var googleSearchSchema = import_zod_openapi3.z.object({
  query: import_zod_openapi3.z.string().min(1).openapi({
    example: "OpenAI"
  })
});
var googleSearchResponseSchema = import_zod_openapi3.z.array(import_zod_openapi3.z.object({
  rank: import_zod_openapi3.z.number().openapi({
    example: 1
  }),
  url: import_zod_openapi3.z.string().url().openapi({
    example: "https://www.example.com"
  }),
  title: import_zod_openapi3.z.string().openapi({
    example: "Example Title"
  }),
  description: import_zod_openapi3.z.string().openapi({
    example: "Example description of the search result."
  })
}));
var googleSearchResponseSchemaWithImage = import_zod_openapi3.z.array(import_zod_openapi3.z.object({
  rank: import_zod_openapi3.z.number().openapi({
    example: 1
  }),
  url: import_zod_openapi3.z.string().url().openapi({
    example: "https://www.example.com"
  }),
  title: import_zod_openapi3.z.string().openapi({
    example: "Example Title"
  }),
  description: import_zod_openapi3.z.string().openapi({
    example: "Example description of the search result."
  }),
  imageURL: import_zod_openapi3.z.string().url().openapi({
    example: "https://www.example.com/image.jpg"
  })
}));
var google = (getBrowser2) => {
  googleRouter.openapi(
    (0, import_zod_openapi3.createRoute)({
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
      const browser2 = yield getBrowser2();
      const searchService = new SearchService(browser2);
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
    (0, import_zod_openapi3.createRoute)({
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
      const browser2 = yield getBrowser2();
      const searchService = new SearchService(browser2);
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
var googleRouter_default = google;

// src/routers/screenshotRouter.ts
var import_zod_openapi4 = require("@hono/zod-openapi");
var screenshotRouter = new import_zod_openapi4.OpenAPIHono();
function takeFullPageScreenshot(context, url) {
  return __async(this, null, function* () {
    const page = yield context.newPage();
    yield page.goto(url, { waitUntil: "networkidle" });
    const screenshot2 = yield page.screenshot({ fullPage: true });
    yield page.close();
    return screenshot2;
  });
}
var screenshotQuerySchema = import_zod_openapi4.z.object({
  url: import_zod_openapi4.z.string().url().openapi({
    example: "https://www.example.com"
  })
});
var screenshot = (getBrowser2) => {
  screenshotRouter.openapi(
    (0, import_zod_openapi4.createRoute)({
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
              schema: import_zod_openapi4.z.any()
            }
          }
        },
        400: {
          description: "Bad Request - URL query parameter is required",
          content: {
            "text/plain": {
              schema: import_zod_openapi4.z.string()
            }
          }
        },
        500: {
          description: "Internal Server Error - Failed to take screenshot",
          content: {
            "text/plain": {
              schema: import_zod_openapi4.z.string()
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
        const browser2 = yield getBrowser2();
        const screenshot2 = yield takeFullPageScreenshot(browser2, url);
        return c.body(screenshot2, 200, { "Content-Type": "image/png" });
      } catch (error) {
        logger_default.error(`Failed to take screenshot: ${error.message}`);
        return c.text("Failed to take screenshot", 500);
      }
    })
  );
  return screenshotRouter;
};
var screenshotRouter_default = screenshot;

// src/index.ts
var browser;
import_dotenv.default.config();
function initializeBrowser() {
  return __async(this, null, function* () {
    if (!browser) {
      browser = yield import_playwright.firefox.launchPersistentContext(import_path.default.resolve(__dirname, "../", "user-data-dir"), {
        headless: true,
        args: [
          "--no-remote",
          "--new-instance",
          "--disable-gpu",
          "--disable-extensions-except=" + import_path.default.resolve(__dirname, "../", "ublock.xpi"),
          "--load-extension=" + import_path.default.resolve(__dirname, "../", "ublock.xpi")
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
var app = new import_zod_openapi5.OpenAPIHono();
app.route("/google", googleRouter_default(getBrowser));
app.route("/baidu", baiduRouter_default(getBrowser));
app.route("/yandex", yandexRouter_default(getBrowser));
app.route("/screenshot", screenshotRouter_default(getBrowser));
app.get("/", (c) => c.text("Hello, Hono!"));
app.get("/ui", (0, import_swagger_ui.swaggerUI)({ url: "/doc" }));
app.doc("/doc.json", {
  openapi: "3.0.0",
  info: {
    title: "Search API",
    version: "1.0.0",
    description: "API for performing web and image searches across multiple providers"
  },
  servers: [
    {
      url: "http://localhost:7860"
    }
  ]
});
app.get("/doc", (c) => __async(exports, null, function* () {
  const content = yield fetch("http://localhost:7860/doc.json");
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
const PORT = process.env.PORT || 7860;
(0, import_node_server.serve)({
  fetch: app.fetch,
  port: PORT
}, (info) => {
  console.log(`Listening on http://localhost:${info.port}`);
});
//# sourceMappingURL=index.js.map
