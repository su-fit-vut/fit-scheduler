const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const frontendDir = path.join(__dirname, 'frontend');

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);

    if (req.method === 'POST' && parsedUrl.pathname === '/load') {
        let body = '';

        req.on('data', chunk => {
            body += chunk;
            // Optionally, limit the size of the body to prevent excessive data
        });

        req.on('end', () => {
            const params = new URLSearchParams(body);

            if (params.has('a') && params.has('b') && params.has('c')) {
                const a = params.get('a');
                const b = params.get('b');
                const c = params.get('c');

                if (a === 's') {
                    let urlToFetch = 'https://www.fit.vut.cz/study/programs/';
                    if (params.has('y')) {
                        urlToFetch += '?year=' + parseInt(params.get('y'), 10);
                    }
                    fetchUrl(urlToFetch, res);
                    return;
                } else if (a === 'u') {
                    const isAlnum = (str) => /^[a-z0-9]+$/i.test(str);
                    const isNumeric = (str) => !isNaN(str);

                    if (isAlnum(b) && isNumeric(c)) {
                        let urlToFetch = 'https://www.fit.vut.cz/study/' + encodeURIComponent(b) + '/' + parseInt(c, 10) + '/';
                        fetchUrl(urlToFetch, res);
                        return;
                    }
                }
            }

            // If none of the conditions are met, send an empty response
            res.end('');
        });
    } else if (req.method === 'GET') {
        // Serve static files from the 'frontend' directory
        let safePath = path.normalize(parsedUrl.pathname).replace(/^(\.\.[\/\\])+/, '');
        let filePath = path.join(frontendDir, safePath);

        fs.stat(filePath, (err, stats) => {
            if (err || !stats.isFile()) {
                // If the file is not found, serve index.html
                filePath = path.join(frontendDir, 'index.html');
            }

            fs.readFile(filePath, (err, data) => {
                if (err) {
                    res.statusCode = 404;
                    res.end('File not found');
                } else {
                    // Set the appropriate Content-Type based on the file extension
                    const ext = path.extname(filePath).toLowerCase();
                    const mimeTypes = {
                        '.html': 'text/html',
                        '.js': 'application/javascript',
                        '.css': 'text/css',
                        '.png': 'image/png',
                        '.jpg': 'image/jpeg',
                        '.gif': 'image/gif',
                        '.svg': 'image/svg+xml',
                        '.json': 'application/json',
                        '.txt': 'text/plain',
                        // Add more MIME types as needed
                    };
                    const contentType = mimeTypes[ext] || 'application/octet-stream';
                    res.setHeader('Content-Type', contentType);
                    res.end(data);
                }
            });
        });
    } else {
        res.statusCode = 405;
        res.end('Method Not Allowed');
    }
});

function fetchUrl(urlToFetch, res) {
    const options = {
        headers: {
            'Accept-language': 'cs'
        }
    };

    https.get(urlToFetch, options, (response) => {
        let data = '';

        response.on('data', (chunk) => {
            data += chunk;
        });

        response.on('end', () => {
            // Forward the status code and headers from the fetched response
            console.info(urlToFetch);
            console.info(response.headers);
            res.writeHead(response.statusCode, response.headers);
            res.end(data);
        });

    }).on('error', (err) => {
        res.statusCode = 500;
        res.end('Error fetching the URL');
    });
}

server.listen(8080, () => {
    console.log('Server is listening on port 8080');
});
