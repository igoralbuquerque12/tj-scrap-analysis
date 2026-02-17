const axios = require("axios");
const cheerio = require("cheerio");
const { isWithinLastDays } = require("../../utils/date");
const { INTERVAL_NEWSPAPER, BODY_CHAR_LIMIT } = require("./config");

/**
 * Scrapes news from the TJ-RJ website.
 * Accesses each news item to extract the body content limited by BODY_CHAR_LIMIT,
 * as the listing page does not provide a summary.
 * @returns {Promise<Array<{date: string, url: string, title: string, summary: string}>>}
 */
async function scrapeTJRJ() {
  const baseUrl = "https://www.tjrj.jus.br";
  const targetUrl = `${baseUrl}/noticias`;

  try {
    const { data: htmlListing } = await axios.get(targetUrl);
    const $ = cheerio.load(htmlListing);

    const filteredNews = [];
    const finalResults = [];

    $("ul.lista-noticias li").each((_, element) => {
      const dateStrong = $(element).find("span.data strong");
      const linkTag = $(element).find("span.data a");

      const href = linkTag.attr("href") || "";
      const urlStr = href ? new URL(href, baseUrl).href : "";
      const title = linkTag.text().trim();

      const rawDate = dateStrong.text().trim();
      const dateRegex = /(\d{2}\/\d{2}\/\d{4})/;
      const match = rawDate.match(dateRegex);
      const formattedDate = match ? match[1] : "";

      if (title && urlStr && formattedDate) {
        if (isWithinLastDays(formattedDate, INTERVAL_NEWSPAPER)) {
          filteredNews.push({ date: formattedDate, url: urlStr, title });
        }
      }
    });

    for (const newsItem of filteredNews) {
      try {
        const { data: newsHtml } = await axios.get(newsItem.url);
        const $news = cheerio.load(newsHtml);

        let contentText = "";

        $news(".journal-content-article p, .portlet-body p").each((_, p) => {
          const paragraphText = $news(p).text().trim();
          if (paragraphText) {
            contentText += paragraphText + " ";
          }
        });

        let cleanSummary = contentText.replace(/\s+/g, " ").trim();

        if (cleanSummary.length > BODY_CHAR_LIMIT) {
          cleanSummary = cleanSummary.substring(0, BODY_CHAR_LIMIT) + "...";
        }

        finalResults.push({
          date: newsItem.date,
          url: newsItem.url,
          title: newsItem.title,
          summary: cleanSummary,
        });
      } catch (err) {
        console.error(`Failed to capture summary from URL: ${newsItem.url}`);
        finalResults.push({ ...newsItem, summary: "" });
      }
    }

    return finalResults;
  } catch (error) {
    console.error("Error accessing TJRJ listing:", error.message);
    throw error;
  }
}

module.exports = { scrapeTJRJ };
