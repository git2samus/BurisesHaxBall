const fs = require('fs');
const puppeteer = require('puppeteer');
const { docopt } = require('docopt');

/* HaxBall Server Script
 * This script launches the headless browser instance and loads the script for HaxBall
 *
 * Takes the ReCaptcha token obtained at: https://www.haxball.com/headlesstoken as a parameter
 * Outputs the URL of the newly created room and remains running for the room to stay open
 */

// docopt cli program
const doc = `Usage:
  server.js <roomName> <adminPassword> <token> [options] [--debug]
  server.js --gui <roomName> <adminPassword> [<token>] [options] [--debug]
  server.js --diagnostics
  server.js --version

Arguments:
  <roomName>            HaxBall room name
  <adminPassword>       In-game admin password
  <token>               Headless token obtained from https://www.haxball.com/headlesstoken

Options:
  -p --players=<num>    Max players
  -t --time=<num>       Time limit
  -s --score=<num>      Score limit
  -m --map=<path>       HaxBall stadium map file
  --public              Make room public
  --gui                 Show the browser window
  --debug               Enable debug messages
  --diagnostics         Load https://www.haxball.com/webrtcdiagnostics print and exit
  --version             Show script version
  -h --help             Show this message
`;

const runDiagnostics = async (page) => {
  // navigate to diagnostics page
  await page.goto('https://www.haxball.com/webrtcdiagnostics');

  // wait for diagnostic to run
  setTimeout(() => {
    page.evaluate('document.querySelector(".page script").remove(); document.querySelector(".page").textContent;')
      .then((content) => console.log(content))
      .then(() => page.close());
  }, 1e3);
};

const runHaxball = async (page, roomArgs) => {
  // navigate to headless haxball page
  await page.goto('https://html5.haxball.com/headless');

  // put haxball arguments on a variable within the browser for the script to read
  await page.evaluate(`const roomArgs = ${ JSON.stringify(roomArgs) };`);

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
        (eh) => eh.getProperty('href')
      ).then(
        (jsh) => jsh.jsonValue()
      ).then(
        (roomUrl) => {
          console.log(roomUrl);

          // save room URL to file for redirect server
          fs.writeFileSync('room.url', roomUrl);
        }
      );
    });
  }), 1e3);
};

// main //

(async () => {
  // parse arguments
  const cliArgs = docopt(doc, { version: '1.1.0' });
  const debug = cliArgs['--debug'];

  if (debug)
    console.error({ cliArgs: cliArgs });

  // open and config browser
  const browser = await puppeteer.launch({ headless: !cliArgs['--gui'] });

  // get default tab
  const [page] = await browser.pages();

  // disable timeout on selectors
  page.setDefaultTimeout(0);

  // hook program close to closing this tab
  page.on('close', () => browser.close());

  if (cliArgs['--diagnostics']) {
    await runDiagnostics(page);
  } else {
    const roomArgs = {
      roomName: cliArgs['<roomName>'],
      adminPassword: cliArgs['<adminPassword>'],
      public: cliArgs['--public'],
      token: cliArgs['<token>'],
      maxPlayers: (cliArgs['--players'])? parseInt(cliArgs['--players']) : null,
      scoreLimit: (cliArgs['--score'])? parseInt(cliArgs['--score']) : null,
      timeLimit: (cliArgs['--time'])? parseInt(cliArgs['--time']) : null,
      stadiumFileText: (cliArgs['--map'])? fs.readFileSync(cliArgs['--map'], 'utf8') : null,
    };

    if (debug)
      console.error({ roomArgs: roomArgs });

    await runHaxball(page, roomArgs);
  };
})();
