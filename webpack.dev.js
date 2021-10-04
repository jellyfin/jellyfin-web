const common = require('./webpack.common');
const { merge } = require('webpack-merge');
const { DefinePlugin } = require('webpack');

module.exports = merge(common, {
    // In order for live reload to work we must use "web" as the target not "browserlist"
    target: 'web',
    mode: 'development',
    entry: './scripts/site.js',
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                enforce: 'pre',
                use: ['source-map-loader']
            },
            {
                test: /\.(ts|tsx)$/,
                exclude: /node_modules/,
                enforce: 'pre',
                use: ['source-map-loader']
            }
        ]
    },
    plugins: [
        new DefinePlugin({
            'process.env.WEBPACK_SERVE': true
        })
    ],
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
