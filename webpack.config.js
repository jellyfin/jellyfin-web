const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    context: path.resolve(__dirname, 'src'),
    entry: './bundle.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: 'amd-require'
    },

    externals: [{
        jquery: {
            amd: "jQuery"
        }
    }],

    resolve: {
        modules: [
            path.resolve(__dirname, 'node_modules')
        ]
    },

    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.(png|jpg|gif)$/i,
                use: ['file-loader']
            }
        ]
    },

    plugins: [
        new CopyPlugin([{
            from: '**/*',
            to: '.'
        }])
    ]
};
