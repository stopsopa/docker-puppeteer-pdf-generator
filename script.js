
if ( ! process.env.P_URL ) {

    process.stdout.write(`Environment variable P_URL is not defined`);

    process.exit(1);
}

if ( ! process.env.P_TMPFILE) {

    process.stdout.write(`Environment variable P_TMPFILE is not defined`);

    process.exit(2);
}

const puppeteer = require('puppeteer');

const timeout = 15000;

(async() => {

    const browser = await puppeteer.launch({
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ],
        executablePath: '/usr/bin/chromium-browser',
        timeout
    });

    try {

        const page = await browser.newPage();

        page.setDefaultNavigationTimeout(timeout);

        page.on('error', msg => {

            process.stdout.write(`error: ` + JSON.stringify(msg));

            browser.close();

            process.exit(1);
        });
        page.on('pageerror', msg => {

            process.stdout.write(`pageerror: ` + JSON.stringify(msg));

            browser.close();

            process.exit(1);
        });

        process.on("unhandledRejection", (reason, p) => {

            process.stdout.write("unhandledRejection: Unhandled Rejection at: Promise" + JSON.stringify(p) + "reason:" + JSON.stringify(reason));

            browser.close();

            process.exit(1);
        });

        await page.goto(process.env.P_URL, {waitUntil: 'networkidle2'});

        // https://github.com/GoogleChrome/puppeteer/issues/666#issuecomment-326796411
        await page.pdf({
            path: '/app/app/' + process.env.P_TMPFILE,
            printBackground: true,
            format: 'A4',
            margin: { top: 0, right: 0, bottom: 0, left: 0 }
        });

        browser.close();
    }
    catch (e) {

        process.stdout.write(`puppeteer catch: ` + JSON.stringify(e.message));

        browser.close();

        process.exit(1);
    }

})();
