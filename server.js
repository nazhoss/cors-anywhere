// Listen on a specific host via the HOST environment variable
var host = process.env.HOST || '0.0.0.0';
// Listen on a specific port via the PORT environment variable
var port = process.env.PORT || 8080;

// Grab the blacklist from the command-line so that we can update the blacklist without deploying
// again. CORS Anywhere is open by design, and this blacklist is not used, except for countering
// immediate abuse (e.g. denial of service). If you want to block all origins except for some,
// use originWhitelist instead.
var originBlacklist = parseEnvList(process.env.CORSANYWHERE_BLACKLIST);
var originWhitelist = parseEnvList(process.env.CORSANYWHERE_WHITELIST);

function parseEnvList(env) {
    if (!env) {
        return [];
    }
    return env.split(',');
}

// Set up rate-limiting to avoid abuse of the public CORS Anywhere server.
var checkRateLimit = require('./lib/rate-limit')(process.env.CORSANYWHERE_RATELIMIT);

var cors_proxy = require('./lib/cors-anywhere');
cors_proxy.createServer({
    originBlacklist: originBlacklist,
    originWhitelist: originWhitelist,
    requireHeader: [],
    checkRateLimit: checkRateLimit,
    removeHeaders: [
        'cookie',
        'cookie2',
        // Strip Heroku-specific headers
        'x-request-start',
        'x-request-id',
        'via',
        'connect-time',
        'total-route-time',
        // Other Heroku added debug headers
        // 'x-forwarded-for',
        // 'x-forwarded-proto',
        // 'x-forwarded-port',
    ],
    redirectSameOrigin: true,
    httpProxyOptions: {
        // Do not add X-Forwarded-For, etc. headers, because Heroku already adds it.
        xfwd: false,
        // Add this to allow the proxy to follow redirects
        followRedirects: true, // Ensure that the proxy follows any redirects
    },
    handleInitialRequest: function (req, res) {
        // Extract the target URL after the first `/` (excluding the proxy URL part)
        let targetUrl = req.url.substring(1); // Remove the leading `/`

        // Ensure the URL starts with a protocol (http:// or https://)
        if (!/^https?:\/\//i.test(targetUrl)) {
            // Add https:// by default if no protocol is provided
            targetUrl = 'https://' + targetUrl; // Default to HTTPS
        }

        // Set the corrected target URL
        req.url = targetUrl; // Update the req.url with the properly formatted URL
    }
}).listen(port, host, function() {
    console.log('Running CORS Anywhere on ' + host + ':' + port);
});
