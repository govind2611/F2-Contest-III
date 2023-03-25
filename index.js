const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const request = require("request");
var fs = require("fs");

const trendingURL = "https://github.com/trending";

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(trendingURL, { waitUntil: "networkidle2" });
  const html = await page.content();
  const $ = cheerio.load(html);

  // Scrape repositories data
  const repositories = [];
  const repoList = $("article.Box-row");
  repoList.each((index, element) => {
    const title = $(element).find("h1.h3 a").text().trim();
    const description = $(element).find("p.my-1").text().trim();
    const url = `https://github.com${$(element).find("h1.h3 a").attr("href")}`;
    const stars = parseInt(
      $(element)
        .find("a.Link--muted:nth-of-type(1)")
        .text()
        .trim()
        .replace(",", "")
    );
    const forks = parseInt(
      $(element)
        .find("a.Link--muted:nth-of-type(2)")
        .text()
        .trim()
        .replace(",", "")
    );
    const language = $(element)
      .find("span.d-inline-block:nth-of-type(1)")
      .text()
      .trim();

    repositories.push({
      title,
      description,
      url,
      stars,
      forks,
      language,
    });
  });

  //storing data in json file
  fs.writeFile("data.json", JSON.stringify(repositories), (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Data saved to data.json");
    }
  });

  // Click on Developers and select JavaScript language
  await page.click('a[href="/trending/developers"]');
  await page.waitForTimeout(3000);
  await page.click("#select-menu-language > .select-menu-button");
  await page.waitForTimeout(3000);
  await page.click('a[href="/trending/developers/javascript?since=daily"]');
  await page.waitForTimeout(3000);

  const developers = await page.evaluate(() => {
    const devItems = document.querySelectorAll(".Box .Box-row");
    const devs = [];
    devItems.forEach((item) => {
      const name = item.querySelector("h1 a").innerText.trim();
      const username =
        item.querySelector(".f4 a")?.href.split("/").pop().trim() || null;
      const repoName = item.querySelector("p")?.innerText.trim() || null;
      const description =
        item.querySelector(".f6.color-fg-muted.mt-1").innerText.trim() || "";

      devs.push({ name, username, repoName, description });
    });
    return devs;
  });

  //storing data in json file
  fs.writeFile("developers.json", JSON.stringify(developers), (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Data saved to data2.json");
    }
  });

  await browser.close();

  const data = {
    repositories,
    developers,
  };
  console.log(JSON.stringify(data, null, 2));
})();
