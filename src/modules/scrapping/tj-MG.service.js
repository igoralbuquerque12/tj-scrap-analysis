const axios = require("axios");
const cheerio = require("cheerio");
const { isWithinLastDays } = require("../../utils/date");
const { INTERVAL_NEWSPAPER } = require("./config");

/**
 * Parses a date string like "13 de fevereiro - 2026" or "16/02/2026" into "dd/mm/yyyy".
 * @param {string} rawDate - The raw date string.
 * @returns {string} The formatted date string or empty if invalid.
 */
function parseTJMGDate(rawDate) {
  if (!rawDate) return "";

  let match = rawDate.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) return match[0];

  const months = {
    janeiro: "01",
    fevereiro: "02",
    março: "03",
    marco: "03",
    abril: "04",
    maio: "05",
    junho: "06",
    julho: "07",
    agosto: "08",
    setembro: "09",
    outubro: "10",
    novembro: "11",
    dezembro: "12",
  };

  match = rawDate.match(/(\d{1,2})\s+de\s+([a-zA-Zç]+)\s+-\s+(\d{4})/i);
  if (match) {
    const day = match[1].padStart(2, "0");
    const month = months[match[2].toLowerCase()] || "01";
    const year = match[3];
    return `${day}/${month}/${year}`;
  }

  return "";
}

/**
 * Scrapes news from the TJ-MG website.
 * @returns {Promise<Array<{date: string, url: string, title: string, summary: string}>>}
 */
async function scrapeTJMG() {
  const baseUrl = "https://www.tjmg.jus.br";
  const targetUrl = `${baseUrl}/portal-tjmg/noticias/`;

  try {
    const { data: html } = await axios.get(targetUrl);
    const $ = cheerio.load(html);
    const news = [];

    $(".featured-items").each((_, element) => {
      const linkTag = $(element).find("a.card");
      const href = linkTag.attr("href") || "";
      const urlStr = href ? new URL(href, baseUrl).href : "";

      const title = $(element).find(".card-title").text().trim();
      const summary = $(element)
        .find('p[data-home-paragraph="true"]')
        .text()
        .trim();

      const rawDate = $(element).find(".clock").text().trim();
      const formattedDate = parseTJMGDate(rawDate);

      if (
        title &&
        urlStr &&
        formattedDate &&
        isWithinLastDays(formattedDate, INTERVAL_NEWSPAPER)
      ) {
        news.push({ date: formattedDate, url: urlStr, title, summary });
      }
    });

    let lastFoundDate = "";

    $(".article-list-horizontal .list-news").each((_, element) => {
      const subheading = $(element).find("p.subheading").text().trim();
      if (subheading) {
        lastFoundDate = parseTJMGDate(subheading);
      }

      const article = $(element).find("article.card");
      const linkTag = article.find(".card-title a");
      const href = linkTag.attr("href") || "";
      const urlStr = href ? new URL(href, baseUrl).href : "";

      const title = linkTag.text().trim();
      const summary = article.find("p.paragraph a").text().trim();

      if (
        title &&
        urlStr &&
        lastFoundDate &&
        isWithinLastDays(lastFoundDate, INTERVAL_NEWSPAPER)
      ) {
        const alreadyExists = news.some(n => n.url === urlStr);
        if (!alreadyExists) {
          news.push({ date: lastFoundDate, url: urlStr, title, summary });
        }
      }
    });

    return news;
  } catch (error) {
    console.error("Error accessing TJMG:", error.message);
    throw error;
  }
}

module.exports = { scrapeTJMG };
