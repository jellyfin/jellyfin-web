const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const Assets = [
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
    target: 'browserslist',
    resolve: {
        modules: [
            path.resolve(__dirname, 'node_modules')
        ]
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: 'index.html'
        }),
        new CopyPlugin({
            patterns: [
                {
                    from: 'themes/',
                    to: 'themes/'
                },
                {
                    from: 'assets/**',
                    globOptions: {
                        dot: true,
                        ignore: ['**/css/*']
                    }
                },
                {
                    from: '*.*',
                    globOptions: {
                        dot: true,
                        ignore: ['**.js', '**.html']
                    }
                }
            ]
        }),
        new CopyPlugin({
            patterns: Assets.map(asset => {
                return {
                    from: path.resolve(__dirname, `./node_modules/${asset}`),
                    to: path.resolve(__dirname, './dist/libraries')
                };
            })
        }),
        new CopyPlugin({
            patterns: LibarchiveWasm.map(asset => {
                return {
                    from: path.resolve(__dirname, `./node_modules/${asset}`),
                    to: path.resolve(__dirname, './dist/libraries/wasm-gen')
                };
            })
        }),
        new WorkboxPlugin.InjectManifest({
            swSrc: path.resolve(__dirname, 'src/serviceworker.js'),
            swDest: 'serviceworker.js'
        })
    ],
    output: {
        filename: '[name].[contenthash].bundle.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: ''
    },
    module: {
        rules: [
            {
                test: /\.(html)$/,
                use: {
                    loader: 'html-loader'
                }
            },
            {
                test: /\.js$/,
                exclude: /node_modules[\\/](?!@uupaa[\\/]dynamic-import-polyfill|date-fns|epubjs|flv.js|libarchive.js)/,
                use: [{
                    loader: 'babel-loader'
                }]
            },
            /* modules that Babel breaks when transforming to ESM */
            {
                test: /node_modules[\\/](pdfjs-dist|xmldom)[\\/].*\.js$/,
                use: [{
                    loader: 'babel-loader',
                    options: {
                        plugins: [
                            '@babel/transform-modules-umd'
                        ]
                    }
                }]
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    'style-loader',
                    'css-loader',
                    {
                        loader: 'postcss-loader',
                        options: {
                            config: {
                                path: __dirname
                            }
                        }
                    },
                    'sass-loader'
                ]
            },
            {
                test: /\.css$/i,
                use: [
                    'style-loader',
                    'css-loader',
                    {
                        loader: 'postcss-loader',
                        options: {
                            config: {
                                path: __dirname
                            }
                        }
                    }
                ]
            },
            {
                test: /\.(png|jpg|gif|svg)$/i,
                use: ['file-loader']
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/,
                use: [
                    'file-loader'
                ]
            },
            {
                test: /\.(mp3)$/i,
                use: ['file-loader']
            },
            {
                test: require.resolve('jquery'),
                loader: 'expose-loader',
                options: {
                    exposes: ['$', 'jQuery']
                }
            }
        ]
    }
};
