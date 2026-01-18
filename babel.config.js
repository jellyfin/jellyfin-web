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
        '@babel/preset-react',
        '@babel/preset-typescript'
    ],
    plugins: [
    ]
};
