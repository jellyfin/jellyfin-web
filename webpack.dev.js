const path = require('path');
const common = require('./webpack.common');
const merge = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = merge(common, {
    mode: 'development',
    entry: './scripts/standalone.js',
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.js$/,
                enforce: 'pre',
                use: ['source-map-loader']
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: 'index.html'
        })
    ],
    devServer: {
        contentBase: path.join(__dirname, 'dist'),
        compress: true
    }
});
