const { merge } = require('webpack-merge');

const common = require('./webpack.common');

const proxyTarget = process.env.JELLYFIN_SERVER;
const proxyUrl = proxyTarget ? new URL(proxyTarget) : null;
const proxyOrigin = proxyUrl ? proxyUrl.origin : null;
const proxyHost = proxyUrl ? proxyUrl.host : null;
const assetPattern = /\.(js|css|map|png|jpe?g|svg|gif|webp|ico|woff2?|ttf|eot)$/i;
const wsPattern = /^\/(socket|embywebsocket)/i;
const setProxyHeaders = proxyReq => {
    if (!proxyReq || !proxyOrigin) return;
    proxyReq.setHeader('origin', proxyOrigin);
    if (proxyHost) {
        proxyReq.setHeader('host', proxyHost);
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
                    secure: false,
                    ws: true,
                    timeout: 120000,
                    proxyTimeout: 120000,
                    logLevel: 'warn',
                    context: (pathname) => wsPattern.test(pathname),
                    onProxyReqWs: setProxyHeaders
                },
                {
                    target: proxyTarget,
                    changeOrigin: true,
                    secure: false,
                    ws: false,
                    timeout: 120000,
                    proxyTimeout: 120000,
                    logLevel: 'warn',
                    context: (pathname) => {
                        if (wsPattern.test(pathname)) return false;
                        if (pathname.startsWith('/sockjs-node')) return false;
                        if (pathname.startsWith('/ws')) return false;
                        if (pathname.startsWith('/webpack-dev-server')) return false;
                        if (assetPattern.test(pathname)) return false;
                        return true;
                    },
                    onProxyReq: setProxyHeaders
                }
            ]
        } : {})
    }
});
