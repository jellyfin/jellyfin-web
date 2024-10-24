const common = require('./webpack.common');
const { merge } = require('webpack-merge');

module.exports = merge(common, {
    mode: 'production',
    entry: {
        'main.jellyfin': './index.tsx',
        'serviceworker': './serviceworker.js'
    }
});
