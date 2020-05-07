const packageConfig = require('./package.json');
const postcssPresetEnv = require('postcss-preset-env');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');

const config = () => ({
    plugins: [
        postcssPresetEnv({browsers: packageConfig.browserslist}),
        autoprefixer(),
        cssnano()
    ]
});

module.exports = config;
