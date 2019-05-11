const path = require('path');

module.exports = {
    context: __dirname + '/src',
    entry: './scripts/site.js',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist')
    },

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
            'node_modules'
        ]
    },

    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    }
};