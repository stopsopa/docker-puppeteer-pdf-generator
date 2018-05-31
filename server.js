/**
 * http://localhost:7777/?url=http%3A%2F%2Fgoogle.com%2Fsearch%3Fncr%26q%3Dpuppeteer
 * encodeURIComponent('http://google.com/search?ncr&q=puppeteer')
 *
 * node server.js --port 7777
 */

const ll = require('./lib/logn');

const shelljs   = require('shelljs');

const config    = require('./config');

(function () {
    let error = false;
    try {

        if (!config.basicAuth.name) {
            error = `something is wrong with name in config.js`;
        }

        if (!config.basicAuth.password) {
            error = `something is wrong with password in config.js`;
        }
    }
    catch (e) {
        error = `something is wrong with config.js`;
    }

    if (error) {

        process.stderr.write();
        process.exit(1);
    }
}());

const parserParams = query => {
    if (typeof query === 'string') {

        query = query.split('&').reduce((acc, val) => {
            var
                a       = val.split(/=/),
                key     = a.shift(),
                dec     = a.join('=')
            ;

            acc[key] = decodeURIComponent(dec).replace(/\+/g, ' ');

            return acc;
        }, {});
    }
    else {
        query = {};
    }

    return query;
};

const auth      = require('basic-auth');

var log = (function(){try{return console.log}catch(e){return function(){}}}());

// const sync = require('child_process').execSync;
const sync = require('child_process').spawnSync;

const fs = require('fs');

const path = require('path');

var getRawBody = require('raw-body')

var tlog = (function () {
    try {
        return (...args) => {

            args = [
                (new Date()).toISOString().substring(0, 19).replace('T', ' '),
                ': ',
                ...args,
                "\n\n"
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

const server    = http.createServer()

server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.log('Address in use, retrying...');
        setTimeout(() => {
            server.close();
            server.listen(PORT, HOST);
        }, 1000);
    }
});

server.listen(port, e => {
    tlog(`\n\n    server is listening on port ${port}\n\n`)
});

const html =  fs.readFileSync('./form.html').toString().replace('<script type="json"></script>', '<script type="json">'+"\n"+JSON.stringify(config.defaults, null, 4)+"\n"+'</script>');

let purl = false;

var type = (function (types) {
    return function (req, res, ext) {

        ext = ext || path.extname(req.url.toLowerCase().split('?')[0]).replace(/[^a-z0-9]/g, '');

        types[ext] && res.setHeader('Content-Type', types[ext]);

        return ext;
    }
}((function (type) {
    type.jpeg = type.jpg;
    return type;
}({
    html    : 'text/html; charset=utf-8',
    js      : 'application/javascript; charset=utf-8',
    css     : 'text/css; charset=utf-8',
    json    : 'application/json; charset=utf-8',
    txt     : 'text/plain; charset=utf-8',
    gif     : 'image/gif',
    bmp     : 'image/bmp',
    jpg     : 'image/jpeg',
    png     : 'image/png',
    pdf     : 'application/pdf',
    ico     : 'image/x-icon',
}))));

const handler = (req, res, next) => {

    const pathname = (function () {
        return req.url.split('?')[0];
    }());

    if (/^\/js\//.test(pathname)) {

        var file = path.resolve(__dirname, '.' + path.sep + (decodeURI(pathname).replace(/\.\.+/g, '.')));

        if (fs.existsSync(file)) {

            try {

                next();

                return res.end(fs.readFileSync(file), type(req, res));
            }
            catch (e) {

                next();

                return res.end('No access to file... ' + file);
            }
        }
    }

    // http://localhost:7777/pdf-generator-check
    if (pathname === '/infinity') {

        return next();
    }

    // http://localhost:7777/pdf-generator-check
    if (pathname === '/pdf-generator-check') {

        res.end('ok');

        return next();
    }

    if (pathname === '/favicon.ico') {

        res.end('no favicon');

        return next();
    }

    getRawBody(req).then(function (buf) {

        let parsed;

        try {

            // expecting here: {
            //     "url": "",
            //     "launch": {
            //     },
            //     "pdf": {
            //         "printBackground": true,
            //             "format": "A4",
            //             "margin": {
            //             "top": 0,
            //                 "right": 0,
            //                 "bottom": 0,
            //                 "left": 0
            //         },
            //         "scale": 0.7
            //     }
            // }
            parsed = JSON.parse(buf.toString());
        }
        catch (e) {

            // here I'm expecting:
            // "url=https%3A%2F%2Fstackoverflow.com%2Fquestions%2F22907231%2Fcopying-files-from-host-to-docker-container&json=%7B%22launch%22%3A%7B%7D%2C%22pdf%22%3A%7B%22printBackground%22%3Atrue%2C%22format....
            // post form field "url" and separately "json"
            // but at the end I'm combining this to format that is visible in try higher

            parsed = parserParams(buf.toString());

            // ll('parsed')
            // ll(parsed)

            if (parsed.json && typeof parsed.json == 'string') {

                try {

                    parsed.json = JSON.parse(parsed.json);

                    parsed = Object.assign({}, {
                        url: parsed.url
                    }, parsed.json);
                }
                catch (e) {

                }
            }
        }

        // {
        //     "url": "",
        //     "json": {
        //     "launch": {},
        //     "pdf": {
        //         "printBackground": true,
        //             "format": "A4",
        //             "margin": {
        //             "top": 0,
        //                 "right": 0,
        //                 "bottom": 0,
        //                 "left": 0
        //         },
        //         "scale": 0.7
        //     }
        // }

        var credentials = auth(req);

        if (!credentials || credentials.name !== config.basicAuth.name || credentials.pass !== config.basicAuth.password) {

            res.statusCode = 401;
            res.setHeader('WWW-Authenticate', 'Basic realm="User and password please"')
            res.end('Access denied');

            return next();
        }

        const jsonResponse = json => {

            if (json.error) {

                res.statusCode = 500;
            }

            res.setHeader('Content-type', 'application/json; charset=utf-8');

            res.end(JSON.stringify(json, null, 4));

            return next();
        }

        log(`\n    vv new request vv ` + req.url);

        if (pathname !== '/generate') {

            res.setHeader('Content-type', 'text/html; charset=UTF-8');

            res.end(`The only endpoint handled is <a href="/generate">/generate</a>`);

            return next();
        }
        // purl = false;

        let sel;

        try {

            if ( purl ) {

                tlog(req.url + ' : server busy');

                return jsonResponse({
                    error: `server is currently processing: ${purl}`
                });
            }

            purl = true;

            let query = parserParams(req.url.split('?')[1]);

            purl = (function () {
                try {
                    return parsed.url;
                }
                catch (e) {}
            }());

            if (query.url) {

                purl = query.url;
            }

            if ( ! purl ) {

                purl = false;

                res.end(html);

                return next();
            }

            tlog(`generating pdf from page: ${purl}`);

            if ( ! /^https?:\/\/.+/.test(purl) ) {

                tlog(purl + ' : url is not valid');

                purl = false;

                return jsonResponse({
                    error: `given url parameter (${purl}) is not valid URL`
                });
            }

            const json = (function ({ url, launch, pdf }) {

                const filteredLaunch = {};

                if (launch && launch.timeout) {

                    filteredLaunch.timeout = launch.timeout;
                }

                const config = JSON.stringify({
                    url,
                    pdf,
                    launch: filteredLaunch
                });

                tlog(`config: '${config}'`);

                // https://stackoverflow.com/a/6182519/5560682
                return Buffer.from(config).toString('base64');

            }(parsed));

            const cmd = `printf '${json}' | /bin/bash pdf.sh "${purl}"`;

            tlog(`cmd: '${cmd}'`);

            try {

                sel = shelljs.exec(cmd);
            }
            catch (e) {

                tlog('exception:');

                purl = false;

                return jsonResponse({
                    error: 'innerCatch',
                    exception: e.toString()
                });
            }

            const file = path.join(__dirname, 'pdf.pdf');

            if (sel.code != 0) {

                tlog(`executing command '${cmd}' failed, exit code: '${sel.code}'`)

                const ret = jsonResponse({
                    error: `processing url '${purl}' failed`
                });

                purl = false;

                return ret;
            }

            if (fs.existsSync(file)) {

                tlog('attempt to return file: ' + file + ' from server');

                const stat = fs.statSync(file);
                
                res.setHeader('Content-Length', stat.size);
                // const stream = fs.createReadStream(file);
                res.setHeader('Content-Type', 'application/pdf');

                // force browser to download
                // res.setHeader('Content-Disposition', 'attachment; filename=quote.pdf');

                // stream.pipe(res);

                const binary = fs.readFileSync(file, "binary")

                res.write(binary, "binary");

                res.end();

                purl = false;

                return setTimeout(next, 0);
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
                error: e.toString(),
                status: sel.status
            });
        }

        purl = false;


    })
    .catch(function (err) {
        res.statusCode = 500
        res.end(err.message)
    });
};

const queue = function (handler) {

    const queue = [];

    let pending = false;

    const trigger = () => {

        if ( ! pending && queue.length ) {

            pending = true;

            handler(...queue.shift(), () => setTimeout(() => {
                pending = false;
                trigger();
            }, 0));
        }
    }

    const tool = (...args) => {

        queue.push([...args]);

        trigger();
    }

    tool.count = () => queue.length;

    return tool;
}

const q = queue(handler);

server.on('request', (req, res) => q(req, res));

