const { merge } = require('webpack-merge');
const https = require('https');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const common = require('./webpack.common');

const proxyTarget = process.env.JELLYFIN_SERVER;

// Check if path is a webpack dev asset that should NOT be proxied
const isWebpackAsset = (pathname) => {
    if (pathname.startsWith('/sockjs-node')) return true;
    if (pathname.startsWith('/ws')) return true;
    if (pathname.startsWith('/webpack-dev-server')) return true;
    if (pathname.startsWith('/__webpack')) return true;
    if (pathname.startsWith('/hot-update')) return true;
    if (pathname.endsWith('.hot-update.json')) return true;
    if (pathname.endsWith('.hot-update.js')) return true;
    if (/\.(js|css|map|png|jpe?g|svg|gif|webp|ico|woff2?|ttf|eot)$/.test(pathname)) {
        // Only exclude if it's in /assets/, /static/, or root-level static files
        if (pathname.startsWith('/assets/') || pathname.startsWith('/static/') || pathname.match(/^\/[^/]+\.(js|css|map|png|jpe?g|svg|gif|webp|ico)$/)) {
            return true;
        }
    }
    return false;
};

module.exports = merge(common, {
    // In order for live reload to work we must use "web" as the target not "browserslist"
    target: process.env.WEBPACK_SERVE ? 'web' : 'browserslist',
    mode: 'development',
    devtool: 'eval-cheap-module-source-map',
    watchOptions: {
        ignored: [
            '**/node_modules/**',
            '**/.git/**',
            '**/dist/**',
            '**/*.log'
        ],
        aggregateTimeout: 300,
        poll: false
    },
    plugins: [
        new ReactRefreshWebpackPlugin()
    ],
    module: {
        rules: [
            {
                test: /\.(js|jsx|ts|tsx)$/,
                exclude: /node_modules/,
                enforce: 'pre',
                use: [{
                    loader: 'babel-loader',
                    options: {
                        plugins: ['react-refresh/babel']
                    }
                }, 'source-map-loader']
            }
        ]
    },
    devServer: {
        compress: true,
        host: '0.0.0.0',
        port: 8080,
        allowedHosts: 'all',
        hot: true,
        liveReload: false,
        devMiddleware: {
            writeToDisk: false,
            // Improve performance with larger in-memory cache
            maxAge: 86400000, // 1 day
        },
        static: {
            cacheControl: false, // Disable caching for static assets during dev
        },
        client: {
            overlay: {
                errors: true,
                warnings: false
            }
        },
        ...(proxyTarget ? {
            proxy: [
                {
                    context: (pathname, req) => !isWebpackAsset(pathname),
                    target: proxyTarget,
                    changeOrigin: true,
                    secure: true,
                    ws: true,
                    agent: new https.Agent({
                        keepAlive: true,
                        keepAliveMsecs: 30000,
                        maxSockets: 50
                    }),
                    onProxyReq(proxyReq, req) {
                        // Forward Jellyfin auth headers
                        if (req.headers.authorization) {
                            proxyReq.setHeader('authorization', req.headers.authorization);
                        }
                        if (req.headers['x-emby-authorization']) {
                            proxyReq.setHeader('x-emby-authorization', req.headers['x-emby-authorization']);
                        }
                        if (req.headers['x-mediabrowser-token']) {
                            proxyReq.setHeader('x-mediabrowser-token', req.headers['x-mediabrowser-token']);
                        }
                        // Set origin/referer to match target
                        proxyReq.setHeader('origin', proxyTarget);
                        proxyReq.setHeader('referer', proxyTarget + '/');
                    },
                    onProxyRes(proxyRes) {
                        // Prevent caching during dev
                        proxyRes.headers['cache-control'] = 'no-store';
                    },
                    logLevel: 'warn'
                }
            ]
        } : {})
    }
});
