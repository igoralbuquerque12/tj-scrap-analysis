const axios = require("axios");
const cheerio = require("cheerio");
const { isWithinLastDays } = require("../../utils/date");
const { INTERVAL_NEWSPAPER, BODY_CHAR_LIMIT } = require("./config");

/**
 * Converts a date string in "dd/mm/yy" format to a Date object.
 * @param {string} dateStr - Date string in "dd/mm/yy" format.
 * @returns {Date} The parsed Date object.
 */
function convertDate(dateStr) {
  const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{2})/);
  if (!match) return new Date(0);
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const year = parseInt(`20${match[3]}`, 10);
  return new Date(year, month, day);
}

/**
 * Scrapes news from the TJ-PR website.
 * @returns {Promise<Array<{date: string, url: string, title: string, summary: string}>>}
 */
async function scrapeTJPR() {
  const api = axios.create({
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  const collectedNews = [];

  let currentUrl = "https://www.tjpr.jus.br/noticias";
  let keepPaging = true;

  while (keepPaging && currentUrl) {
    try {
      const response = await api.get(currentUrl);
      const $ = cheerio.load(response.data);

      const cards = $(".asset-abstract");
      if (cards.length === 0) break;

      for (const card of cards) {
        const titleEl = $(card).find("a.asset-title");
        const dateEl = $(card).find(".date-info");

        if (titleEl.length > 0 && dateEl.length > 0) {
          const title = titleEl.text().trim();
          const newsLink = titleEl.attr("href");

          const absoluteUrl = newsLink.startsWith("http")
            ? newsLink
            : `https://www.tjpr.jus.br${newsLink}`;

          const cleanUrl = absoluteUrl.split("?")[0];

          const dateText = dateEl.text().trim();
          const matchDate = dateText.match(/(\d{2}\/\d{2}\/\d{2})/);

          if (matchDate) {
            const publishDateStr = matchDate[1];

            const [d, m, y] = publishDateStr.split("/");
            const fullDate = `${d}/${m}/20${y}`;

            if (!isWithinLastDays(fullDate, INTERVAL_NEWSPAPER)) {
              keepPaging = false;
              break;
            }

            let summary = "Content not found.";
            try {
              const newsResponse = await api.get(absoluteUrl);
              const $news = cheerio.load(newsResponse.data);

              $news("script, style, noscript, iframe").remove();

              const newsBody = $news(
                ".journal-content-article, .asset-content"
              ).find("p");

              if (newsBody.length > 0) {
                const cleanText = newsBody.text().replace(/\s+/g, " ").trim();
                summary =
                  cleanText.length > BODY_CHAR_LIMIT
                    ? cleanText.substring(0, BODY_CHAR_LIMIT) + "..."
                    : cleanText;
              } else {
                const fallbackText = $news(".asset-content")
                  .text()
                  .replace(/\s+/g, " ")
                  .trim();
                if (fallbackText) {
                  summary =
                    fallbackText.length > BODY_CHAR_LIMIT
                      ? fallbackText.substring(0, BODY_CHAR_LIMIT) + "..."
                      : fallbackText;
                }
              }
            } catch (err) {
              summary = "Error requesting internal news page.";
            }

            collectedNews.push({
              date: fullDate,
              url: cleanUrl,
              title,
              summary,
            });
          }
        }
      }

      if (keepPaging) {
        const nextBtn = $('a[title="Próxima página"]');
        if (nextBtn.length > 0 && !nextBtn.closest("li").hasClass("disabled")) {
          currentUrl = nextBtn.attr("href");
        } else {
          keepPaging = false;
        }
      }
    } catch (error) {
      console.error("Critical error in TJPR:", error.message);
      throw error;
    }
  }

  return collectedNews;
}

module.exports = { scrapeTJPR };
