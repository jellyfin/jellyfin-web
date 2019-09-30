const path = require("path");
const common = require("./webpack.common");
const merge = require("webpack-merge");
const CopyPlugin = require('copy-webpack-plugin');

module.exports = merge(common, {
    mode: "development",
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: 'amd-require'
    },
    plugins: [
        new CopyPlugin([{
            from: '**/*',
            to: '.'
        }])
    ]
});
