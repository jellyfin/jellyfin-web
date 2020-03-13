const postcssPresetEnv = require('postcss-preset-env');
const cssnano = require('cssnano');

const config = () => ({
  plugins: [
    postcssPresetEnv(),
    cssnano()
  ]
});

module.exports = config
