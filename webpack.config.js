const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    context: path.resolve(__dirname, 'src'),
    entry: './bundle.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: 'amd'
    },

    externals: [{
        jquery: {
            amd: "jQuery"
        }
    }],

    resolve: {
        modules: [
            path.resolve(__dirname, 'src/scripts'),
            path.resolve(__dirname, 'src/components'),
            path.resolve(__dirname, 'src/components/playback'),
            path.resolve(__dirname, 'src/components/emby-button'),
            path.resolve(__dirname, 'src/components/usersettings'),
            path.resolve(__dirname, 'src/components/images'),
            path.resolve(__dirname, 'src/bower_components'),
            path.resolve(__dirname, 'src/bower_components/apiclient'),
            path.resolve(__dirname, 'src/bower_components/apiclient/sync'),
            path.resolve(__dirname, 'src/components/cardbuilder'),
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
