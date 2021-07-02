const packageConfig = require('./package.json');
const postcssPresetEnv = require('postcss-preset-env');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const tailwindcss = require('tailwindcss');

const config = () => ({
    syntax: 'postcss-scss',
    parser: 'postcss-scss',
    plugins: [
        tailwindcss(),
        // Explicitly specify browserslist to override ones from node_modules
        // For example, Swiper has it in its package.json
        postcssPresetEnv({
            browsers: packageConfig.browserslist,
            features: {
                // This causes conflicts with TailwindCSS due to it already handling this.
                'focus-within-pseudo-class': false
            }
        }),
        autoprefixer({overrideBrowserslist: packageConfig.browserslist}),
        cssnano()
    ]
});

module.exports = config;
