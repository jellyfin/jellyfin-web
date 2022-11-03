module.exports = {
    preset: [
        'default',
        // Turn off `mergeLonghand` because it combines `padding-*` and `margin-*`,
        // breaking fallback styles.
        // https://github.com/cssnano/cssnano/issues/1163
        // https://github.com/cssnano/cssnano/issues/1192
        { mergeLonghand: false }
    ]
};
