import puppeteer from "puppeteer";

export const convertHTMLToPDF = async (html, callback, options = null, puppeteerArgs = null, remoteContent = false) => {
  if (typeof html !== "string") {
    throw new Error(
      "Invalid Argument: HTML expected as type of string and received a value of a different type. Check your request body and request headers."
    );
  }

  let startTime, endTime, elapsedTime;

  // Puppeteer launch time
  startTime = Date.now();
  let browser;
  if (puppeteerArgs) {
    browser = await puppeteer.launch(puppeteerArgs);
  } else {
    browser = await puppeteer.launch({
      executablePath: "/usr/bin/chromium-browser",
      args: [
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--allow-file-access-from-files",
        "--enable-local-file-accesses",
      ],
    });
  }
  endTime = Date.now();
  elapsedTime = endTime - startTime;
  console.log(`Browser launched in ${elapsedTime} ms`);

  // New page creation time
  startTime = Date.now();
  const page = await browser.newPage();
  endTime = Date.now();
  elapsedTime = endTime - startTime;
  console.log(`New page created in ${elapsedTime} ms`);

  if (!options) {
    options = { width: "16.5in", height: "23.4in", preferCSSPageSize: false, printBackground: true };
  }

  // Page content setting or navigation time
  if (remoteContent === true) {
    startTime = Date.now();
    await page.goto(`data:text/html;base64,${Buffer.from(html).toString("base64")}`, {
      waitUntil: "networkidle0",
      timeout: 0,
    });
    endTime = Date.now();
    elapsedTime = endTime - startTime;
    console.log(`Page navigation completed in ${elapsedTime} ms`);
  } else {
    startTime = Date.now();
    await page.setContent(html);
    endTime = Date.now();
    elapsedTime = endTime - startTime;
    console.log(`Page content set in ${elapsedTime} ms`);
  }

  // PDF generation time
  startTime = Date.now();
  await page.pdf(options).then(callback, function (error) {
    console.log(error);
  });
  endTime = Date.now();
  elapsedTime = endTime - startTime;
  console.log(`PDF generated in ${elapsedTime} ms`);

  // Browser close time
  startTime = Date.now();
  await browser.close();
  endTime = Date.now();
  elapsedTime = endTime - startTime;
  console.log(`Browser closed in ${elapsedTime} ms`);
};
