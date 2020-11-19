const path = require('path');

const CopyPlugin = require('copy-webpack-plugin');
const WorkerPlugin = require('worker-plugin');

const Assets = [
    'alameda/alameda.js',
    'native-promise-only/npo.js',
    'libarchive.js/dist/worker-bundle.js',
    'libass-wasm/dist/js/subtitles-octopus-worker.js',
    'libass-wasm/dist/js/subtitles-octopus-worker.data',
    'libass-wasm/dist/js/subtitles-octopus-worker.wasm',
    'libass-wasm/dist/js/subtitles-octopus-worker-legacy.js',
    'libass-wasm/dist/js/subtitles-octopus-worker-legacy.data',
    'libass-wasm/dist/js/subtitles-octopus-worker-legacy.js.mem',
    'pdfjs-dist/build/pdf.worker.js'
];

const LibarchiveWasm = [
    'libarchive.js/dist/wasm-gen/libarchive.js',
    'libarchive.js/dist/wasm-gen/libarchive.wasm'
];

module.exports = {
    context: path.resolve(__dirname, 'src'),
    entry: './bundle.js',
    stats: 'errors-only',
    resolve: {
        modules: [
            path.resolve(__dirname, 'node_modules')
        ]
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: 'amd-require'
    },
    plugins: [
        new CopyPlugin(
            Assets.map(asset => {
                return {
                    from: path.resolve(__dirname, `./node_modules/${asset}`),
                    to: path.resolve(__dirname, './dist/libraries')
                };
            })
        ),
        new CopyPlugin(
            LibarchiveWasm.map(asset => {
                return {
                    from: path.resolve(__dirname, `./node_modules/${asset}`),
                    to: path.resolve(__dirname, './dist/libraries/wasm-gen/')
                };
            })
        ),
        new WorkerPlugin()
    ]
};
