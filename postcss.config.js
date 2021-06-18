const packageConfig = require('./package.json');
const postcssPresetEnv = require('postcss-preset-env');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const tailwindcss = require('tailwindcss');

const config = () => ({
    plugins: [
        tailwindcss(),
        // Explicitly specify browserslist to override ones from node_modules
        // For example, Swiper has it in its package.json
        postcssPresetEnv({browsers: packageConfig.browserslist}),
        autoprefixer({overrideBrowserslist: packageConfig.browserslist}),
        cssnano()
    ]
});

module.exports = config;
