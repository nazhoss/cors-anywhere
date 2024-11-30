var host = process.env.HOST || '0.0.0.0';
var port = process.env.PORT || 8080;

var originBlacklist = parseEnvList(process.env.CORSANYWHERE_BLACKLIST);
var originWhitelist = parseEnvList(process.env.CORSANYWHERE_WHITELIST) || ['https://youtube.com', 'https://www.youtube.com', 'https://example.com', 'https://fonts.googleapis.com'];

function parseEnvList(env) {
    if (!env) {
        return [];
    }
    return env.split(',');
}

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
        'x-request-start',
        'x-request-id',
        'via',
        'connect-time',
        'total-route-time',
    ],
    redirectSameOrigin: true,
    httpProxyOptions: {
        xfwd: false,
    },
}).listen(port, host, function() {
    console.log('Running CORS Anywhere on ' + host + ':' + port);
});
