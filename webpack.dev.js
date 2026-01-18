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
        allowedHosts: ['all'],
        hot: true,
        devMiddleware: {
            writeToDisk: false
        },
        proxy: [
            {
                context: (pathname) => !isWebpackAsset(pathname),
                target: proxyTarget || 'https://2activedesign.com',
                changeOrigin: true,
                secure: false
            }
        ]
    }
});
