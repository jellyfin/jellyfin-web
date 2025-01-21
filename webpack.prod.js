const common = require('./webpack.common');
const { merge } = require('webpack-merge');

module.exports = merge(common, {
    mode: 'production',
    entry: {
        'main.jellyfin': './index.jsx',
        'crashReporter': './crashReporter/index.ts',
        'serviceworker': './serviceworker.js'
    }
});
