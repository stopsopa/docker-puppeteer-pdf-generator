
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

const dir = path.resolve(__dirname, 'pdfs-generated');

const fakedb = (function () {

    const file = path.resolve(__dirname, 'fakedb.json');

    function getall(deletefile = false) {

        let obj = {};

        if (fs.existsSync(file)) { // warning: if under dirfile there will be broken link (pointing to something nonexisting) then this function will return false even if link DO EXIST but it's broken

            try {

                obj = JSON.parse(fs.readFileSync(file, 'utf8').toString());
            }
            catch (e) {

                log.dump({
                    json_parse_file: file,
                    error: e
                });
            }

            deletefile && fs.unlinkSync(file);
        }

        return obj;
    }

    return {
        get: url => {

            const obj = getall();

            if ( ! url ) {

                return obj;
            }

            return obj[url];
        },
        set: async (url, data) => {

            const obj = getall();

            obj[url] = data;

            fs.writeFileSync(file, JSON.stringify(obj, null, 4));
        }
    };
}());

pdfgen.setup({
    server              : process.env.PROTECTED_PDF_GENERATOR_ENDPOINT,
    user                : process.env.PROTECTED_PDF_GENERATOR_BASIC_USER,
    pass                : process.env.PROTECTED_PDF_GENERATOR_BASIC_PASS,
    timeoutms           : 20 * 1000,
    time_tolerance_sec  : 3,
    dir,
    urlgenerate         : url => {

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

        const data = await pdfgen({
            last_db_mtime_sec_utc: (function (db = {}) {

                const utc = db.mtime || (new Date()).toISOString();

                return parseInt(parseInt((new Date(utc)).getTime(), 10) / 1000, 10);

            }(fakedb.get(target))),
            urlgenerateargs: [
                target
            ],
            debugfn: data => {

                const {
                    url,
                    ...rest
                } = data;

                fakedb.set(url, rest);
            }
        });

        if (data.state !== 'not-expired') {

            log.dump({
                stress_test_file_generated: data,
            }, 20)
        }
    }
    catch (e) {

        log.dump({
            stress_general_error: e,
        })
    }

    process.stdout.write('-');

    buff = buff.filter(u => u !== target);

    // await delay(500);

    // trigger();
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