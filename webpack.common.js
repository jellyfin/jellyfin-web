const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

const Assets = [
    'native-promise-only/npo.js',
    'libarchive.js/dist/worker-bundle.js',
    'libarchive.js/dist/libarchive.wasm',
    '@jellyfin/libass-wasm/dist/js/default.woff2',
    '@jellyfin/libass-wasm/dist/js/subtitles-octopus-worker.js',
    '@jellyfin/libass-wasm/dist/js/subtitles-octopus-worker.wasm',
    '@jellyfin/libass-wasm/dist/js/subtitles-octopus-worker-legacy.js',
    'pdfjs-dist/build/pdf.worker.js',
    'libpgs/dist/libpgs.worker.js'
];

const config = {
    entry: {
        ...THEMES_BY_ID
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                {
                    from: 'assets',
                    to: 'assets'
                },
                'config.json',
                'robots.txt',
                {
                    from: 'touchicon*.png',
                    context: path.resolve(__dirname, 'node_modules/@jellyfin/ux-web/favicons'),
                    to: 'favicons'
                },
                ...Assets.map(asset => {
                    return {
                        from: path.resolve(__dirname, `node_modules/${asset}`),
                        to: 'libraries'
                    };
                })
            ]
        }),
    },
