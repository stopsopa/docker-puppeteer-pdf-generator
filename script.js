
if ( ! process.env.P_URL ) {

    process.stdout.write(`Environment variable P_URL is not defined`);

    process.exit(1);
}

if ( ! process.env.P_TMPFILE) {

    process.stdout.write(`Environment variable P_TMPFILE is not defined`);

    process.exit(2);
}

const puppeteer = require('puppeteer');

(async() => {

    const browser = await puppeteer.launch({
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ],
        executablePath: '/usr/bin/chromium-browser'
    });

    const page = await browser.newPage();

    await page.goto(process.env.P_URL, {waitUntil: 'networkidle2'});

    await page.pdf({
        path: '/app/app/' + process.env.P_TMPFILE,
        format: 'letter'
    });

    browser.close();

})();
