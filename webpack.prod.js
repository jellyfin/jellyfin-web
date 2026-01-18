const { merge } = require('webpack-merge');
const { InjectManifest } = require('workbox-webpack-plugin');

const common = require('./webpack.common');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = merge(common, {
    mode: 'production',
    entry: {
        ...common.entry
    },
    plugins: [
        new InjectManifest({
            swSrc: './src/sw.js',
            swDest: 'serviceworker.js',
            exclude: [/\.map$/, /manifest\.json$/, /service-worker\.js$/],
            maximumFileSizeToCacheInBytes: 5 * 1024 * 1024 // 5MB
        })
    ],
    optimization: {
        ...common.optimization,
        minimize: true,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    compress: {
                        drop_console: true, // Remove console.log in production
                        drop_debugger: true,
                        pure_funcs: ['console.log', 'console.info', 'console.debug']
                    },
                    mangle: true,
                    output: {
                        comments: false
                    }
                },
                extractComments: false
            }),
            new CssMinimizerPlugin({
                minimizerOptions: {
                    preset: [
                        'default',
                        {
                            discardComments: { removeAll: true }
                        }
                    ]
                }
            })
        ]
    },
    performance: {
        hints: 'warning',
        maxAssetSize: 512000, // 512KB
        maxEntrypointSize: 1024000 // 1MB
    }
});
