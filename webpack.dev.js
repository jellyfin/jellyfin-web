const { merge } = require('webpack-merge');

const common = require('./webpack.common');

const proxyTarget = process.env.JELLYFIN_SERVER;
const proxyUrl = proxyTarget ? new URL(proxyTarget) : null;
const proxyOrigin = proxyUrl ? proxyUrl.origin : null;
const proxyHost = proxyUrl ? proxyUrl.host : null;
const assetPattern = /\.(js|css|map|png|jpe?g|svg|gif|webp|ico|woff2?|ttf|eot)$/i;
const wsPattern = /^\/(socket|embywebsocket)/i;
const setProxyHeaders = (proxyReq, req) => {
    if (!proxyReq || !proxyOrigin) return;
    proxyReq.setHeader('origin', proxyOrigin);
    if (proxyHost) {
        proxyReq.setHeader('host', proxyHost);
    }
    // Forward Jellyfin auth headers if present
    if (req.headers.authorization) {
        proxyReq.setHeader('authorization', req.headers.authorization);
    }
    if (req.headers['x-emby-authorization']) {
        proxyReq.setHeader('x-emby-authorization', req.headers['x-emby-authorization']);
    }
    if (req.headers['x-mediabrowser-token']) {
        proxyReq.setHeader('x-mediabrowser-token', req.headers['x-mediabrowser-token']);
    }
};

module.exports = merge(common, {
    // In order for live reload to work we must use "web" as the target not "browserslist"
    target: process.env.WEBPACK_SERVE ? 'web' : 'browserslist',
    mode: 'development',
    devtool: 'eval-cheap-module-source-map',
    module: {
        rules: [
            {
                test: /\.(js|jsx|ts|tsx)$/,
                exclude: /node_modules/,
                enforce: 'pre',
                use: ['source-map-loader']
            }
        ]
    },
    devServer: {
        compress: true,
        host: '0.0.0.0',
        port: 8080,
        allowedHosts: 'all',
        client: {
            overlay: {
                errors: true,
                warnings: false
            }
        },
        ...(proxyTarget ? {
            proxy: [
                {
                    target: proxyTarget,
                    changeOrigin: true,
                    secure: true,
                    ws: true,
                    timeout: 30000,
                    proxyTimeout: 30000,
                    logLevel: 'debug',
                    context: (pathname) => wsPattern.test(pathname),
                    onProxyReqWs: setProxyHeaders
                },
                {
                    target: proxyTarget,
                    changeOrigin: true,
                    secure: true,
                    ws: false,
                    timeout: 30000,
                    proxyTimeout: 30000,
                    logLevel: 'debug',
                    context: (pathname) => {
                        if (wsPattern.test(pathname)) return false;
                        if (pathname.startsWith('/sockjs-node')) return false;
                        if (pathname.startsWith('/ws')) return false;
                        if (pathname.startsWith('/webpack-dev-server')) return false;
                        if (assetPattern.test(pathname)) return false;
                        return true;
                    },
                    onProxyReq: setProxyHeaders,
                    onProxyRes: (proxyRes) => {
                        // Prevent caching weirdness during dev
                        proxyRes.headers['cache-control'] = 'no-store';
                    }
                }
            ]
        } : {})
    }
});
