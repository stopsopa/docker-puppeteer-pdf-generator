
require('dotenv-up')({
    override    : false,
    deep        : 1,
}, true, 'tests');

const querystring   = require('querystring');

const log = require('inspc');

const delay = require('nlab/delay');

const pdfgen = require('./lib/pdf-generator');

const sha256 = require('nlab/sha256');

pdfgen.setup({
    server      : process.env.PROTECTED_PDF_GENERATOR_ENDPOINT,
    user        : process.env.PROTECTED_PDF_GENERATOR_BASIC_USER,
    pass        : process.env.PROTECTED_PDF_GENERATOR_BASIC_PASS,
    timeoutms   : 20 * 1000,
    dir         : '/Users/sd/Workspace/projects/pdf-generater/runtime/pdfs-generated',
    urlgenerate : url => {

        const p = sha256(url).split(/^(.)(.*)$/).splice(1,2);

        p[1] += '.pdf';

        return {
            url,
            subdir: p[0],
            filename: p[1],
        };
    },
});

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

        const data = await pdfgen(null, target);

        log.dump({
            data,
        }, 20)
    }
    catch (e) {

        log.dump({
            error: e,
        })
    }

    // await delay(1000);

    // run(target);
};

run(target);