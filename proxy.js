const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const bodyParser = require('body-parser');  // If you're using body-parser package

const app = express();

// Enable CORS for all routes
app.use(cors());
app.use(bodyParser.json());

app.use('/:target', (req, res, next) => {
    const targetAPI = req.params.target;

    const proxy = createProxyMiddleware({
        target: `https://${targetAPI}`,
        changeOrigin: true,
        pathRewrite: {
            [`^/${targetAPI}`]: '', // remove base path
        },
        onProxyReq: function (proxyReq, req, res) {
            const acceptedHeaders = ['accept', 'api-key', 'Content-Type', 'User-Agent', 'host'];
            let headers = proxyReq.getHeaders();
            // Header is key-value pair
            Object.keys(headers).forEach((header) => {
                if (!acceptedHeaders.includes(header)) {
                    proxyReq.removeHeader(header);
                }
            });
            if (req.body && req.body!=="{}") {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
            }
        },
        onError: function (err, req, res) { // handling proxy errors
            res.status(500).send({
                error: 'Proxy Error',
                details: err.message
            });
        },
        onProxyRes: function (proxyRes, req, res) {
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        }
    });
    proxy(req, res, next);
});

// Express default error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});



const port = 5000;
app.listen(port, () => console.log(`Proxy server running on port ${port}`));

module.exports = app;