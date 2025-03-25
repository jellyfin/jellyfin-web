const common = require('./webpack.common');
const { merge } = require('webpack-merge');

const THEMES = [
    'appletv',
    'blueradiance',
    'dark',
    'light',
    'purplehaze',
    'wmc'
];

module.exports = merge(common, {
    mode: 'production',
    entry: {
        'main.jellyfin': './index.jsx',
        'serviceworker': './serviceworker.js',
        ...THEMES.reduce((acc, theme) => {
            acc[`themes/${theme}`] = `./themes/${theme}/theme.scss`;
            return acc;
        }, {})
    }
});
