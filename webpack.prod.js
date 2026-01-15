const { merge } = require('webpack-merge');

const common = require('./webpack.common');

module.exports = merge(common, {
    mode: 'production',
    entry: {
        'main.jellyfin': './index.tsx',
        ...common.entry,
        'serviceworker': './serviceworker.js'
    }
});
