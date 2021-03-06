const fs = require('fs');
const puppeteer = require('puppeteer');
const { docopt } = require('docopt');
const { S3 } = require('@aws-sdk/client-s3');

/* HaxBall Server Script
 * This script launches the headless browser instance and loads the script for HaxBall
 *
 * Takes the ReCaptcha token obtained at: https://www.haxball.com/headlesstoken as a parameter
 * Outputs the URL of the newly created room and remains running for the room to stay open
 */

// docopt cli program
const doc = `Usage:
  server.js <roomName> <token> [options] [--debug]
  server.js --gui <roomName> [<token>] [options] [--debug]
  server.js --diagnostics
  server.js --version

Arguments:
  <roomName>            HaxBall room name
  <token>               Headless token obtained from https://www.haxball.com/headlesstoken

Options:
  -p --players=<num>    Max players
  -t --time=<num>       Time limit
  -s --score=<num>      Score limit
  -m --map=<path>       HaxBall stadium map file
  --bucket=<name>       AWS S3 bucket name to put redirect page
  --public              Make room public
  --gui                 Show the browser window
  --debug               Enable debug messages
  --diagnostics         Load https://www.haxball.com/webrtcdiagnostics print and exit
  --version             Show script version
  -h --help             Show this message
`;

// builder for the redirect page on S3
const index_html = (url) => `<!DOCTYPE html>
<html>
  <head>
    <meta http-equiv="refresh" content="0; URL=${ url }" />
  </head>
  <body>
    <a href="${ url }">${ url }</a>
  </body>
</html>`;

// main //

(async () => {
  // utility to print debug messages to stderr
  const logger = msg => { if (debug) console.error(msg) };

  // parse arguments
  const cliArgs = docopt(doc, { version: '1.0.0' });
  const debug = cliArgs['--debug'];

  logger({ cliArgs: cliArgs });

  // open and config browser
  const browser = await puppeteer.launch({ headless: !cliArgs['--gui'] });

  // get default tab
  const [page] = await browser.pages();

  // disable timeout on selectors
  page.setDefaultTimeout(0);

  // hook program close to closing this tab
  page.on('close', () => browser.close());

  if (cliArgs['--diagnostics']) {
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
      roomName: cliArgs['<roomName>'],
      public: cliArgs['--public'],
      token: cliArgs['<token>'],
      maxPlayers: (cliArgs['--players'])? parseInt(cliArgs['--players']) : null,
      scoreLimit: (cliArgs['--score'])? parseInt(cliArgs['--score']) : null,
      timeLimit: (cliArgs['--time'])? parseInt(cliArgs['--time']) : null,
      stadiumFileText: (cliArgs['--map'])? fs.readFileSync(cliArgs['--map'], 'utf8') : null,
    };

    logger({ roomArgs: roomArgs });

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
            console.log(roomUrl)

            if (cliArgs['--bucket']) {
              const s3 = new S3();

              // update redirect page
              s3.putObject({
                Bucket: cliArgs['--bucket'],
                Key: 'index.html',
                Body: index_html(roomUrl),
                ContentType: 'text/html',
              }, (err, data) => {
                if (err)
                  console.error(err, err.stack); // an error occurred
                else
                  logger(data); // successful response
              });
            };
          }
        );
      });
    }), 1e3);
  };
})();
