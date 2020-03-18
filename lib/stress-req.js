
const URL           = require('url').URL;

const https         = require('https');

const http          = require('http');

const querystring   = require('querystring');

const log           = require('inspc');

const th            = msg => new Error(`stress-req.js error: ${String(msg)}`);

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

        log.dump({
            rq,
        }, 6);

        var req = lib.request(rq, res => {

            return resolve(res)

            const isPdf = (res.headers['content-type'] || '').toLowerCase() === 'application/pdf';

            if (isPdf) {

                res.setEncoding('utf8');

                let body = '';

                res.on('data', chunk => {

                    body += chunk
                });

                res.on('end', () => {

                    // log.dump({
                    //     status: res.statusCode,
                    //     headers: res.headers,
                    //     isPdf,
                    //     uri,
                    //     body,
                    //     rq,
                    // }, 5)

                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body,
                    })
                });
            }
            else {

                // log.dump({
                //     status: res.statusCode,
                //     headers: res.headers,
                //     isPdf,
                //     uri,
                //     rq,
                // }, 5)

                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                })
            }
        });

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

            log.dump({
                sendjson: opt.json,
            }, 5)

            req.write(JSON.stringify(opt.json));
        }

        if ( typeof opt.body !== 'undefined' ) {

            req.write(opt.body);
        }

        req.end();
    });
}

module.exports = request;

// ;(async function () {
//
//     try {
//
//         const target = `https://know-aml.com/en/get-involved/activity-wall`;
//
//         const data = await request(target, {
//             timeout: 8000,
//         });
//
//         log.dump({
//             data,
//         }, 3)
//     }
//     catch (e) {
//
//         log.dump({
//             error: e
//         })
//     }
// }());