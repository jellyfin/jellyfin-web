const { merge } = require('webpack-merge');

const common = require('./webpack.common');

module.exports = merge(common, {
    // In order for live reload to work we must use "web" as the target not "browserslist"
    target: process.env.WEBPACK_SERVE ? 'web' : 'browserslist',
    mode: 'development',
    entry: { 'main.jellyfin': './index.tsx' },
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
        }
    }
});
