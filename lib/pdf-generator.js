
const sr = require('./stress-req');

module.exports = async url => {

    try {

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
    }
    catch (e) {

    }
}