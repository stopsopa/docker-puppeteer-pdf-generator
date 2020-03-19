/**
 * https://github.com/stopsopa/docker-puppeteer-pdf-generator
 *
 *
 *
 *
// .env
PROTECTED_PDF_GENERATOR_ENDPOINT="http://localhost:7777/generate"
PROTECTED_PDF_GENERATOR_BASIC_USER="admin"
PROTECTED_PDF_GENERATOR_BASIC_PASS="password"

pdfgen.setup({
    server              : process.env.PROTECTED_PDF_GENERATOR_ENDPOINT,
    user                : process.env.PROTECTED_PDF_GENERATOR_BASIC_USER,
    pass                : process.env.PROTECTED_PDF_GENERATOR_BASIC_PASS,
    timeoutms           : 20 * 1000,
    time_tolerance_sec  : 3,
    dir,
    urlgenerate         : url => {
        // urlgenerateargs - pass here whatever you need to generate
        // url, subdir & filename

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
const data = await pdfgen({
    last_db_mtime_sec_utc: (function (db = {}) { // int UTC timestamp

        const utc = db.mtime || (new Date()).toISOString();

        return parseInt(parseInt((new Date(utc)).getTime(), 10) / 1000, 10);

    }(fakedb.get(target))),
    urlgenerateargs: [
        target
    ],
    debugfn: data => { // optional

        const {
            url,
            ...rest
        } = data;

        fakedb.set(url, rest);
    }
});
 *
 */

const fs                = require('fs');

const path              = require('path');

const https             = require('https');

const http              = require('http');

const querystring       = require('querystring');

const URL               = require('url').URL;

const trim              = require('nlab/trim');

const isObject          = require('nlab/isObject');

const delay             = require('nlab/delay');

const log               = require('inspc');

const Base64            = require('js-base64').Base64;

const mkdirp            = require('mkdirp');

const th                = msg => new Error(`pdf-generator error: ${msg}`);

function request (url, opt = {}) {

    let {
        method      = 'GET',
        timeout     = 30 * 1000,
        get         = {},
        headers     = {},
    } = opt;

    if ( typeof method !== 'string' ) {

        throw th(`method is not a string`);
    }

    method = method.toLowerCase();

    return new Promise((resolve, reject) => {

        const uri   = new URL(url);

        const lib   = (uri.protocol === 'https:') ? https : http;

        const query = querystring.stringify(get);

        const rq = {
            hostname    : uri.hostname,
            port        : uri.port || ( (uri.protocol === 'https:') ? '443' : '80'),
            path        : uri.pathname + uri.search + (query ? (uri.search.includes('?') ? '&' : '?') + query : ''),
            method,
            headers     : {
                'Content-Type': 'application/json; charset=utf-8',
                Accept: `text/html; charset=utf-8`,
                ...headers
            },
        };

        var req = lib.request(rq, res => resolve(res));

        req.on('socket', function (socket) { // uncomment this to have timeout

            socket.setTimeout(timeout);

            socket.on('timeout', () => { // https://stackoverflow.com/a/9910413/5560682

                req.abort();

                reject({
                    type: 'timeout',
                })
            });
        });

        req.on('error', e => reject({
            type: 'error',
            error: String(e),
        }));

        if ( typeof opt.json !== 'undefined' ) {

            if (opt.method === 'get') {

                throw th(`opt.json is given but method is still get`);
            }

            req.write(JSON.stringify(opt.json));
        }

        req.end();
    });
}

let config = false;

const tool = async ({
    last_db_mtime_sec_utc,
    urlgenerateargs = [],
    debugfn = false,
}) => {

    if ( ! isObject(config) ) {

        throw th(`first use setup() method to configure library`);
    }

    const {
        server,
        basicheader,
        dir,
        timeoutms,
        urlgenerate,
        time_tolerance_sec,
    } = config;

    let url;

    try {

        if ( ! Array.isArray(urlgenerateargs) ) {

            throw th(`urlgenerateargs is not an array`);
        }

        if ( urlgenerateargs.length < 1 ) {

            throw th(`urlgenerateargs.length < 1`);
        }

        const gen = urlgenerate(...urlgenerateargs);

        const {
            subdir,
            filename,
        } = gen;

        url = gen.url;

        if ( ! Number.isInteger(last_db_mtime_sec_utc) ) {

            throw th(`last_db_mtime_sec_utc(${last_db_mtime_sec_utc}) is not an integer`);
        }

        if ( last_db_mtime_sec_utc < 0 ) {

            throw th(`last_db_mtime_sec_utc(${last_db_mtime_sec_utc}) is smaller than 0`);
        }

        if ( typeof url !== 'string' ) {

            throw th(`url is not a string`);
        }

        if ( ! /^https?:\/\//.test(url) ) {

            throw th(`url(${url}) should start from http or https`);
        }

        if (typeof subdir !== 'string') {

            throw th(`subdir(${subdir}) is not a string`);
        }

        if (!trim(subdir)) {

            throw th(`subdir is an empty string`);
        }

        if (typeof filename !== 'string') {

            throw th(`filename(${filename}) is not a string`);
        }

        if (!trim(filename)) {

            throw th(`filename is an empty string`);
        }

        const justdir = path.resolve(dir, subdir);

        const file = path.resolve(justdir, filename);

        let state = 'didnt-exists';

        let db_is_never_then_positive;

        if (fs.existsSync(file)) { // warning: if under dirfile there will be broken link (pointing to something nonexisting) then this function will return false even if link DO EXIST but it's broken

            const stats = fs.statSync(file);

            const mtimesec = parseInt(parseInt(stats.mtimeMs, 10) / 1000, 10); // mtime sek UTC

            db_is_never_then_positive = mtimesec - last_db_mtime_sec_utc;

            if ( Math.abs(db_is_never_then_positive) < time_tolerance_sec ) {

                return {
                    mode: 'exist-and-not-expired-no-need-to-generate',
                    state: 'not-expired',
                    db_is_never_then_positive,
                    full: file,
                    ...gen,
                }
            }
            else {

                state = 'expired';
            }
        }

        const ret = {
            mode: 'generated',
            state,
            db_is_never_then_positive,
            full: file,
            ...gen,
        };

        const res = await request(server, {
            timeout: timeoutms,
            method: 'POST',
            headers: {
                "Authorization": `Basic ${basicheader}`
            },
            json: querystring.stringify({
                // "launch": {},
                pdf: JSON.stringify({
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
                url,
            }),
        });

        if ( res.statusCode != 200 ) {

            throw th(`request to '${server}' to generate pdf from '${url}' returned status code '${res.statusCode}'`);
        }

        try {

            mkdirp.sync(justdir);

        } catch (e) {

            throw th(`mkdirp.sync(${justdir}) error: ${e}`);
        }

        if (fs.existsSync(file)) { // warning: if under dirfile there will be broken link (pointing to something nonexisting) then this function will return false even if link DO EXIST but it's broken

            fs.unlinkSync(file);
        }

        await new Promise((resolve, reject ) => {

            var stream = res.pipe(fs.createWriteStream(file));

            stream.on('finish', () => resolve());

            stream.on('error', e => reject({
                writable_stream_error: e
            }));
        });

        if (debugfn && typeof debugfn === 'function' ) {

            const stats = fs.statSync(file);

            const mtime = (new Date(stats.mtimeMs)).toISOString();

            await debugfn({
                ...ret,
                mtime,
            });
        }

        return ret;
    }
    catch (e) {

        log.dump({
            "pdf-generator.js error: ": e,
            url,
        });

        throw th(`pdf-generator.js general error: '${JSON.stringify(e, null, 4)}'`);
    }
};

tool.setup = (opt = {}) => {

    const {
        server,
        user,
        pass,
        dir,
        timeoutms,
        urlgenerate,
        time_tolerance_sec,
    } = opt || {};

    if (typeof server !== 'string') {

        throw th(`server(${server}) is not a string`);
    }

    if (!trim(server)) {

        throw th(`server is an empty string`);
    }

    if (!/^https?:\/\//.test(server)) {

        throw th(`server(${server}) should start from http or https`);
    }

    if (typeof user !== 'string') {

        throw th(`user(${user}) is not a string`);
    }

    if (!trim(user)) {

        throw th(`user is an empty string`);
    }

    if (typeof pass !== 'string') {

        throw th(`pass(${pass}) is not a string`);
    }

    if (!trim(pass)) {

        throw th(`pass is an empty string`);
    }

    if (!Number.isInteger(timeoutms)) {

        throw th(`timeoutms(${timeoutms}) is not an integer`);
    }

    if (timeoutms < 3000) {

        throw th(`timeoutms(${timeoutms}) is smaller than 3000`);
    }

    if (!Number.isInteger(time_tolerance_sec)) {

        throw th(`time_tolerance_sec(${time_tolerance_sec}) is not an integer`);
    }

    if (time_tolerance_sec < 3) {

        throw th(`time_tolerance_sec(${time_tolerance_sec}) is smaller than 3 sek`);
    }

    if (typeof urlgenerate !== 'function') {

        throw th(`urlgenerate is not a function`);
    }

    if (typeof dir !== 'string') {

        throw th(`dir(${dir}) is not a string`);
    }

    if (!trim(dir)) {

        throw th(`dir is an empty string`);
    }

    try {

        mkdirp.sync(dir);

    } catch (e) {

        throw th(e);
    }

    try {

        fs.accessSync(dir, fs.constants.W_OK);

    } catch (e) {

        throw th(`directory '${dir}' is not writtable`);
    }

    opt.basicheader = Base64.encode(`${user}:${pass}`);

    config = opt;
};

module.exports = tool;