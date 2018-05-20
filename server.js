/**
 * http://localhost:7777/?url=http%3A%2F%2Fgoogle.com%2Fsearch%3Fncr%26q%3Dpuppeteer
 * encodeURIComponent('http://google.com/search?ncr&q=puppeteer')
 *
 * node server.js --port 7777
 */

// const ll = require('../../react/webpack/logn');

const shelljs = require('shelljs');

var log = (function(){try{return console.log}catch(e){return function(){}}}());

// const sync = require('child_process').execSync;
const sync = require('child_process').spawnSync;

const fs = require('fs');

const path = require('path');

var tlog = (function () {
    try {
        return (...args) => {

            args = [
                (new Date()).toISOString().substring(0, 19).replace('T', ' '),
                ': ',
                ...args,
                "\n"
            ];

            process.stdout.write(args.join(''));
        }
    }
    catch (e) {
        return () => {};
    }
}());

const args = (function (obj, tmp) {
    process.argv
        .slice(2)
        .map(a => {

            if (a.indexOf('--') === 0) {

                tmp = a.substring(2).replace(/^\s*(\S*(\s+\S+)*)\s*$/, '$1');

                if (tmp) {

                    obj[tmp] = (typeof obj[tmp] === 'undefined') ? true : obj[tmp];
                }

                return;
            }

            if (a === 'true') {

                a = true
            }

            if (a === 'false') {

                a = false
            }

            if (tmp !== null) {

                if (obj[tmp] === true) {

                    return obj[tmp] = [a];
                }

                obj[tmp].push(a);
            }
        })
    ;

    Object.keys(obj).map(k => {
        (obj[k] !== true && obj[k].length === 1) && (obj[k] = obj[k][0]);
        (obj[k] === 'false') && (obj[k] = false);
    });

    return {
        all: () => JSON.parse(JSON.stringify(obj)),
        get: (key, def) => {

            var t = JSON.parse(JSON.stringify(obj));

            if (typeof def === 'undefined')

                return t[key];

            return (typeof t[key] === 'undefined') ? def : t[key] ;
        },
        update: data => {

            // delete data['config'];
            //
            // delete data['dump'];
            //
            // delete data['help'];
            //
            // delete data['inject'];

            obj = data;
        }
    };
}({}));


let port = args.get('port');

if ( ! port ) {

    throw `No port specified --port 7777`;
}

port = parseInt(port, 10);

const http        = require('http');

const server    = http.createServer().listen(port);

const html =  fs.readFileSync('./form.html').toString();

let purl = false;

server.on('request', (req, res) => {

    const jsonResponse = json => {

        if (json.error) {

            res.statusCode = 500;
        }

        return res.end(JSON.stringify(json, null, 4));
    }

    const pathname = (function () {
        return req.url.split('?')[0];
    }());

    log("\n");
    tlog(`request: `, req.url);

    if (pathname !== '/generate') {

        res.setHeader('Content-type', 'text/html; charset=UTF-8');

        return res.end(`The only endpoint handled is <a href="/generate">/generate</a>`);
    }
    // purl = false;

    let sel;

    try {

        if ( purl ) {

            tlog(req.url + ' : server busy');

            purl = false;

            return jsonResponse({
                error: `server is currently processing: ${purl}`
            });
        }

        purl = true;

        let query = req.url.split('?')[1];

        if (typeof query === 'string') {

            query = query.split('&').reduce((acc, val) => {
                var
                    a       = val.split(/=/),
                    key     = a.shift(),
                    dec     = a.join('=')
                ;
                acc[key] = decodeURIComponent(dec);
                return acc;
            }, {});
        }
        else {
            query = {};
        }

        purl = query.url;

        if ( ! purl ) {

            purl = false;

            return res.end(html);
        }

        if ( ! /^https?:\/\/.+/.test(purl) ) {

            tlog(purl + ' : url is not valid');

            purl = false;

            return jsonResponse({
                error: `given url parameter (${query.url}) is not valid URL`
            });
        }

        try {

            sel = shelljs.exec(`/bin/bash pdf.sh "${purl}"`);
        }
        catch (e) {

            tlog('exception:');

            // ll(e);

            purl = false;

            return jsonResponse({
                error: 'innerCatch',
                exception: e
            });
        }

        tlog('continue...');

        if (sel.code != 0) {

            tlog('process returne dcode: ' + file)

            purl = false;

            return jsonResponse({
                error: `processing url '${query.url}' failed`
            });
        }

        const file = path.join(__dirname, 'pdf.pdf');

        if (fs.existsSync(file)) {

            tlog('attempt to return file: ' + file)

            const stream = fs.createReadStream(file);
            const stat = fs.statSync(file);
            res.setHeader('Content-Length', stat.size);
            res.setHeader('Content-Type', 'application/pdf');

            // force browser to download
            // res.setHeader('Content-Disposition', 'attachment; filename=quote.pdf');

            stream.pipe(res);
        }
        else {

            jsonResponse({
                file: path.join(__dirname, 'pdf.pdf'),
                error: 'file was not created'
            })
        }
    }
    catch (e) {

        jsonResponse({
            error: e,
            status: sel.status
        });
    }

    purl = false;
});

