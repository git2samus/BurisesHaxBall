const fs = require('fs');
const puppeteer = require('puppeteer');
const {docopt} = require('docopt');

/* HaxBall Server Script
 * This script launches the headless browser instance and loads the script for HaxBall
 *
 * Takes the ReCaptcha token obtained at: https://www.haxball.com/headlesstoken as a parameter
 * Outputs the URL of the newly created room and remains running for the room to stay open
 */

const doc = `Usage:
  server.js <name> <token> [--debug]
  server.js --gui <name> [<token>] [--debug]
  server.js --version

Arguments:
  <name>        HaxBall room name
  <token>       Headless token obtained from https://www.haxball.com/headlesstoken

Options:
  --gui         Show the browser window
  --debug       Enable debug messages
  --version     Show script version
`;

(async () => {
  // parse arguments
  const args = docopt(doc, {version: '1.0.0'});
  const debug = args['--debug'];

  // utility to print debug messages to stderr
  const logger = msg => { if (debug) console.error(msg) };
  logger(args);

  // open and config browser
  const browser = await puppeteer.launch({headless: !args['--gui']});

  // get default tab
  const [page] = await browser.pages();

  // hook program close to closing this tab
  page.on('close', () => browser.close());

  // navigate to headless haxball page
  await page.goto('https://html5.haxball.com/headless');

  // put haxball arguments on a variable within the browser for the script to read
  const roomArgs = {
    name: args['<name>'],
    token: args['<token>'],
  };
  await page.evaluate(`const roomArgs = ${JSON.stringify(roomArgs)};`);

  // load HaxBall script into page (need to wait for the iframe to load)
  setTimeout(() => fs.readFile('haxball.js', 'utf8', (err, hbScript) => {
    if (err) throw err;

    page.evaluate(hbScript).then(() => {
      // identify frame
      const iframe = page.frames().find(
        frame => frame.parentFrame() !== null
      );

      // look for room url within frame
      iframe.waitForSelector('#roomlink a').then(
        eh => eh.getProperty('href')
      ).then(
        jsh => jsh.jsonValue()
      ).then(
        href => console.log(href)
      );
    });
  }), 1e3);
})();
