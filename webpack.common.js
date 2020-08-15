const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
    context: path.resolve(__dirname, 'src'),
    target: 'web',
    resolve: {
        modules: [
            path.resolve(__dirname, 'node_modules')
        ]
    },
    plugins: [
        (new CleanWebpackPlugin())
    ],
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist')
    }
};
