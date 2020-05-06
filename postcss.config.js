const postcssPresetEnv = require('postcss-preset-env');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');

const config = () => ({
    plugins: [
        postcssPresetEnv(),
        autoprefixer(),
        cssnano()
    ]
});

module.exports = config;
