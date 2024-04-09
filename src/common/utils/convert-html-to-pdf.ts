import puppeteer from "puppeteer";

export const convertHTMLToPDF = async (html, callback, options = null, puppeteerArgs = null, remoteContent = true) => {
  if (typeof html !== "string") {
    throw new Error(
      "Invalid Argument: HTML expected as type of string and received a value of a different type. Check your request body and request headers."
    );
  }
  let browser;
  if (puppeteerArgs) {
    browser = await puppeteer.launch(puppeteerArgs);
  } else {
    browser = await puppeteer.launch({
      executablePath: "/usr/bin/chromium-browser",
      args: ["--no-sandbox", "--disable-dev-shm-usage", "--allow-file-access-from-files", "--enable-local-file-accesses"],
    });
  }

  const page = await browser.newPage();
  if (!options) {
    options = { width: "16.5in",height: "23.4in", preferCSSPageSize: false };
  }

  if (remoteContent === true) {
    await page.goto(`data:text/html;base64,${Buffer.from(html).toString("base64")}`, {
      waitUntil: "networkidle0",
    });
  } else {
    //page.setContent will be faster than page.goto if html is a static
    await page.setContent(html);
  }

  await page.pdf(options).then(callback, function (error) {
    console.log(error);
  });
  await browser.close();
};
