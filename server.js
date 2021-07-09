const fs = require('fs');
const puppeteer = require('puppeteer');

/* HaxBall Server Script
 * This script launches the headless browser instance and loads the script for HaxBall
 *
 * Takes the ReCaptcha token obtained at: https://www.haxball.com/headlesstoken as a parameter
 * Outputs the URL of the newly created room and remains running for the room to stay open
 */

(async () => {
  // open and config browser
  const browser = await puppeteer.launch({headless: false});

  // open new tab (there's usually one already but whatevs)
  const page = await browser.newPage();

  // hook program close to closing this tab
  page.on('close', () => browser.close());

  // navigate to headless haxball page
  await page.goto('https://html5.haxball.com/headless');
})();
