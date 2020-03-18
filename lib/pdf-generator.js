
const fs                = require('fs');

const path              = require('path');

const trim              = require('nlab/trim');

const isObject          = require('nlab/isObject');

const delay             = require('nlab/delay');

const querystring       = require('querystring');

const log               = require('inspc');

const Base64            = require('js-base64').Base64;

const mkdirp            = require('mkdirp');

const request           = require('./stress-req');

const th                = msg => new Error(`pdf-generator error: ${msg}`);

let config = false;

// const target = 'https://stopsopa.github.io/docker-puppeteer-pdf-generator/example.html'

const tool = async (lastModification, ...args /* at this point in args there is only 'url' param */) => {

    if ( ! isObject(config) ) {

        throw th(`first use setup() method to configure library`);
    }

    const {
        server,
        basicheader,
        dir,
        timeoutms,
        urlgenerate,
    } = config;

    try {

        const {
            url,
            subdir,
            filename,
        } = urlgenerate(...args);

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

        let file = path.resolve(dir, subdir);

        try {

            mkdirp.sync(file);

        } catch (e) {

            throw th(`mkdirp.sync(${file}) error: ${e}`);
        }

        file = path.resolve(file, filename);

        if (fs.existsSync(file)) { // warning: if under dirfile there will be broken link (pointing to something nonexisting) then this function will return false even if link DO EXIST but it's broken

            fs.unlinkSync(file);
        }

        var stream = fs.createWriteStream(file);

        res.pipe(stream);
    }
    catch (e) {

        log.dump({
            "pdf-generator-error": e
        })
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