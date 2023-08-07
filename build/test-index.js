"use strict";
// import puppeteer from 'puppeteer';
// puppeteer
//   .launch({
//     headless: false,
//   })
//   .then(async (browser) => {
//     let urls = [
//       'https://www.google.com',
//       'https://www.firefox.com',
//       'https://www.google.com',
//       'https://www.google.com',
//       'https://www.google.com',
//       'https://www.google.com',
//     ];
//     await Promise.all(
//       urls.map((url) => {
//         return new Promise<void>(async (resolve, reject) => {
//           // Open new page for each url
//           let page = await browser.newPage();
//           await page.goto(url, { timeout: 0, waitUntil: 'networkidle2' });
//           console.log(page.url());
//           resolve();
//         });
//       }),
//     );
//     await browser.close();
//   });
