const axios = require("axios");
const cheerio = require("cheerio");
const { isWithinLastDays } = require("../../utils/date");
const { INTERVAL_NEWSPAPER, BODY_CHAR_LIMIT } = require("./config");

const BASE_URL = "https://www.tjsp.jus.br";
const NEWS_URL = `${BASE_URL}/Noticias`;

/**
 * Fetches the specific news page and extracts its content.
 * @param {string} url - The URL of the news article.
 * @returns {Promise<{title: string, summary: string}>}
 */
async function fetchArticleBody(url) {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const title =
      $("h3, .titulo-noticia").first().text().trim() || "Title not found";

    const bodyText = $("article p, .noticia p, .conteudo p")
      .text()
      .replace(/\s+/g, " ")
      .trim();

    const summary =
      bodyText.length > BODY_CHAR_LIMIT
        ? bodyText.substring(0, BODY_CHAR_LIMIT) + "..."
        : bodyText;

    return { title, summary };
  } catch (error) {
    console.error(`Error reading news ${url}:`, error.message);
    return { title: "Error", summary: "Could not extract content" };
  }
}

/**
 * Scrapes news from the TJ-SP website.
 * @returns {Promise<Array<{date: string, url: string, title: string, summary: string}>>}
 */
async function scrapeTJSP() {
  let currentPage = 1;
  let keepFetching = true;
  const collectedNews = [];

  while (keepFetching) {
    try {
      const response = await axios.get(`${NEWS_URL}?pagina=${currentPage}`);
      const $ = cheerio.load(response.data);

      const links = $("a[href*='codigoNoticia=']");

      if (links.length === 0) break;

      const uniqueLinks = new Set();

      for (let el of links) {
        const href = $(el).attr("href");
        if (!uniqueLinks.has(href)) {
          uniqueLinks.add(href);

          let dateStr = null;
          let currentEl = $(el);

          for (let i = 0; i < 4; i++) {
            const textContext = currentEl.text();
            const match = textContext.match(/(\d{2})\/(\d{2})\/(\d{4})/);
            if (match) {
              dateStr = match[0];
              break;
            }
            currentEl = currentEl.parent();
          }

          if (dateStr) {
            if (isWithinLastDays(dateStr, INTERVAL_NEWSPAPER)) {
              const fullLink = href.startsWith("http")
                ? href
                : `${BASE_URL}${href}`;

              const articleData = await fetchArticleBody(fullLink);
              collectedNews.push({
                date: dateStr,
                url: fullLink,
                title: articleData.title,
                summary: articleData.summary,
              });
            } else {
              keepFetching = false;
            }
          }
        }
      }

      currentPage++;
    } catch (error) {
      console.error(
        `Error accessing page ${currentPage} of TJSP:`,
        error.message
      );
      throw error;
    }
  }

  return collectedNews;
}

module.exports = { scrapeTJSP };
