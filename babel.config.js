module.exports = {
    babelrcRoots: [
        // Keep the root as a root
        '.'
    ],
    sourceType: 'unambiguous',
    presets: [
        [
            '@babel/preset-env',
            {
                useBuiltIns: 'usage',
                corejs: 3
            }
        ],
        '@babel/preset-react'
    ],
    plugins: [
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-proposal-private-methods',
        'babel-plugin-dynamic-import-polyfill'
    ]
};
