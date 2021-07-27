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
  server.js <name> <token> [options] [--debug]
  server.js --gui <name> [<token>] [options] [--debug]
  server.js --diagnostics
  server.js --version

Arguments:
  <name>            HaxBall room name
  <token>           Headless token obtained from https://www.haxball.com/headlesstoken

Options:
  -p --players=<p>  Max players
  -t --time=<t>     Time limit
  -s --score=<s>    Score limit
  -m --map=<m>      HaxBall stadium map file
  --public          Make room public
  --gui             Show the browser window
  --debug           Enable debug messages
  --diagnostics     Load https://www.haxball.com/webrtcdiagnostics print and exit
  --version         Show script version
  -h --help         Show this message
`;

(async () => {
  // utility to print debug messages to stderr
  const logger = msg => { if (debug) console.error(msg) };

  // parse arguments
  const args = docopt(doc, {version: '1.0.0'});
  const debug = args['--debug'];

  logger({args: args});

  // open and config browser
  const browser = await puppeteer.launch({headless: !args['--gui']});

  // get default tab
  const [page] = await browser.pages();

  // disable timeout on selectors
  page.setDefaultTimeout(0);

  // hook program close to closing this tab
  page.on('close', () => browser.close());

  if (args['--diagnostics']) {
    // navigate to diagnostics page
    await page.goto('https://www.haxball.com/webrtcdiagnostics');

    // wait for diagnostic to run
    setTimeout(() => {
      page.evaluate('document.querySelector(".page script").remove(); document.querySelector(".page").textContent;')
        .then((content) => console.log(content))
        .then(() => page.close());
    }, 1e3);
  } else {
    // navigate to headless haxball page
    await page.goto('https://html5.haxball.com/headless');

    // put haxball arguments on a variable within the browser for the script to read
    const roomArgs = {
      roomName: args['<name>'],
      public: args['--public'],
      token: args['<token>'],
      maxPlayers: (args['--players'])? parseInt(args['--players']) : null,
      scoreLimit: (args['--score'])? parseInt(args['--score']) : null,
      timeLimit: (args['--time'])? parseInt(args['--time']) : null,
      stadiumFileText: (args['--map'])? fs.readFileSync(args['--map'], 'utf8') : null,
    };

    logger({roomArgs: roomArgs});

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
  };
})();
