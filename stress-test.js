
require('dotenv-up')({
    override    : false,
    deep        : 1,
}, true, 'tests');

const fs = require('fs');

const path = require('path');

const querystring   = require('querystring');

const log = require('inspc');

const delay = require('nlab/delay');

const trim = require('nlab/trim');

const pdfgen = require('./lib/pdf-generator');

const sha256 = require('nlab/sha256');

pdfgen.setup({
    server      : process.env.PROTECTED_PDF_GENERATOR_ENDPOINT,
    user        : process.env.PROTECTED_PDF_GENERATOR_BASIC_USER,
    pass        : process.env.PROTECTED_PDF_GENERATOR_BASIC_PASS,
    timeoutms   : 20 * 1000,
    dir         : '/Users/sd/Workspace/projects/pdf-generater/runtime/pdfs-generated',
    // urlgenerate : url => {
    //
    //     const p = sha256(url).split(/^(.)(.*)$/).splice(1,2);
    //
    //     p[1] += '.pdf';
    //
    //     return {
    //         url,
    //         subdir: p[0],
    //         filename: p[1],
    //     };
    // },
    urlgenerate : url => {

        const r = decodeURIComponent(decodeURIComponent(url));

        const slug = r.split('?')[0].split('/').pop();

        const p = slug.split(/^(.)(.*)$/).splice(1,2);

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

const file = path.resolve(__dirname, 'stress-test.txt');

if ( ! fs.existsSync(file) ) { // warning: if under dirfile there will be broken link (pointing to something nonexisting) then this function will return false even if link DO EXIST but it's broken

    throw new Error(`file '${file}' doesn't exists`);
}

let content = fs.readFileSync(file, 'utf8').toString();

const reg = /^https?:\/\//

content = content.split("\n").map(a => trim(a)).filter(Boolean).filter(a => reg.test(a));

const next = (function (c) {

    let i = -1;

    return () => {

        i += 1;

        if ( ! content[i] ) {

            i = 0;
        }

        return content[i];
    }
}(content));

const maxconcurrent = 3;

let buff = [];

const run = async target => {

    try {

        console.log("");
        process.stdout.write('buff: ');
        buff.forEach(n => {
            process.stdout.write(String(content.indexOf(n) + 1) + ' ');
        });

        const data = await pdfgen(null, target);

        // log.dump({
        //     data,
        // }, 20)
    }
    catch (e) {

        log.dump({
            error: e,
        })
    }

    process.stdout.write('-');

    buff = buff.filter(u => u !== target);

    trigger();
};

function trigger() {

    for ( let i = 0, l = content.length ; i < l ; i += 1 ) {

        if (buff.length >= maxconcurrent) {

            break;
        }

        const n = next();

        if (buff.find(b => b === n)) {

            break;
        }

        process.stdout.write('+')

        buff.push(n);

        run(n);
    }
}

trigger();