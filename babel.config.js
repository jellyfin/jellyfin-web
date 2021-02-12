module.exports = {
    babelrcRoots: [
        // Keep the root as a root
        '.'
    ],
    presets: [
        [
            '@babel/preset-env',
            {
                useBuiltIns: 'usage',
                corejs: 3
            },
            '@babel/preset-typescript'
        ]
    ],
    plugins: [
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-proposal-private-methods',
        'babel-plugin-dynamic-import-polyfill'
    ]
};
