const path = require("path");
const common = require("./webpack.common");
const merge = require("webpack-merge");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ConcatPlugin = require('webpack-concat-plugin');

module.exports = merge(common, {
    mode: "development",
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, "dist"),
        libraryTarget: "amd-require"
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"]
            },
            {
                test: /\.(png|jpg|gif)$/i,
                use: ["file-loader"]
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: 'index.html'
        }),
        new ConcatPlugin({
            name: 'scripts/apploader.js',
            filesToConcat: ['./scripts/apploader.js']
        })
    ],
    devServer: {
        proxy: {
            "!/**/*.html" : "http://localhost:8096",
            "!/**/*.css" : "http://localhost:8086",
            "!/**/*.js" : "http://localhost:8086"
        }
    }
});
