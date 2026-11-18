const packageConfig = require('./package.json');
const postcssPresetEnv = require('postcss-preset-env');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');

const DEV_MODE = process.env.NODE_ENV !== 'production';

const config = () => ({
    plugins: [
        // Explicitly specify browserslist to override ones from node_modules
        // For example, Swiper has it in its package.json
        postcssPresetEnv({ browsers: packageConfig.browserslist }),
        autoprefixer({ overrideBrowserslist: packageConfig.browserslist }),
        DEV_MODE ? null : cssnano()
    ]
});

module.exports = config;
