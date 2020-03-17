
require('dotenv-up')({
    override    : false,
    deep        : 1,
}, true, 'tests');

const querystring   = require('querystring');

const log = require('inspc');

const delay = require('nlab/delay');

const request = require('./lib/stress-req');

const Base64 = require('js-base64').Base64;

const basicheader = Base64.encode(`${process.env.PROTECTED_PDF_GENERATOR_BASIC_USER}:${process.env.PROTECTED_PDF_GENERATOR_BASIC_PASS}`);

const target = 'https://stopsopa.github.io/docker-puppeteer-pdf-generator/example.html'

const run = async target => {

    try {
        // {
        //     "launch": {},
        //     "pdf": {
        //         "displayHeaderFooter": true,
        //             "format": "A4",
        //             "margin": {
        //             "top": "0",
        //                 "right": "0",
        //                 "bottom": "0",
        //                 "left": "0"
        //         },
        //         "scale": 0.7
        //     },
        //     "url": "https://stopsopa.github.io/docker-puppeteer-pdf-generator/example.html"
        // }

        const data = await request(process.env.PROTECTED_PDF_GENERATOR_ENDPOINT, {
            timeout: 8000,
            method: 'POST',
            headers: {
                "Authorization": `Basic ${basicheader}`
            },
            json: querystring.stringify({
                "launch": {},
                "pdf": JSON.stringify({
                    "displayHeaderFooter": true,
                    "format": "A4",
                    "margin": {
                        "top": "0",
                        "right": "0",
                        "bottom": "0",
                        "left": "0"
                    },
                    "scale": 0.7
                }),
                "url": target
            }),
        });

        log.dump({
            data,
        }, 20)
    }
    catch (e) {

        log.dump({
            error: e,
        })
    }

    await delay(1000);

    run(target);
};

run(target);