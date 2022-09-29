const path = require('path');
const common = require('./webpack.common');
const { merge } = require('webpack-merge');
const WorkboxPlugin = require('workbox-webpack-plugin');

module.exports = merge(common, {
    mode: 'production',
    entry: { 'main.jellyfin': './index.jsx' },
    plugins: [
        new WorkboxPlugin.InjectManifest({
            swSrc: path.resolve(__dirname, 'src/serviceworker.js'),
            swDest: 'serviceworker.js'
        })
    ]
});
