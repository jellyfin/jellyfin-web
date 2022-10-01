const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { DefinePlugin } = require('webpack');

const Assets = [
    'native-promise-only/npo.js',
    'libarchive.js/dist/worker-bundle.js',
    '@jellyfin/libass-wasm/dist/js/subtitles-octopus-worker.js',
    '@jellyfin/libass-wasm/dist/js/subtitles-octopus-worker.data',
    '@jellyfin/libass-wasm/dist/js/subtitles-octopus-worker.wasm',
    '@jellyfin/libass-wasm/dist/js/subtitles-octopus-worker-legacy.js',
    '@jellyfin/libass-wasm/dist/js/subtitles-octopus-worker-legacy.data',
    '@jellyfin/libass-wasm/dist/js/subtitles-octopus-worker-legacy.js.mem',
    'pdfjs-dist/build/pdf.worker.js'
];

const LibarchiveWasm = [
    'libarchive.js/dist/wasm-gen/libarchive.js',
    'libarchive.js/dist/wasm-gen/libarchive.wasm'
];

const DEV_MODE = process.env.NODE_ENV !== 'production';

const NODE_MODULES_REGEX = /[\\/]node_modules[\\/]/;

const config = {
    context: path.resolve(__dirname, 'src'),
    target: 'browserslist',
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        modules: [
            path.resolve(__dirname, 'node_modules')
        ]
    },
    plugins: [
        new DefinePlugin({
            __WEBPACK_SERVE__: JSON.stringify(!!process.env.WEBPACK_SERVE)
        }),
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: 'index.html',
            // Append file hashes to bundle urls for cache busting
            hash: true
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
        })
    ],
    output: {
        filename: '[name].bundle.js',
        chunkFilename: '[name].[contenthash].chunk.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: ''
    },
    optimization: {
        runtimeChunk: 'single',
        splitChunks: {
            chunks: 'all',
            maxInitialRequests: Infinity,
            cacheGroups: {
                node_modules: {
                    test(module) {
                        return NODE_MODULES_REGEX.test(module.context);
                    },
                    name(module) {
                        // get the name. E.g. node_modules/packageName/not/this/part.js
                        // or node_modules/packageName
                        const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
                        return `node_modules.${packageName}`;
                    }
                }
            }
        }
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
                test: /\.(js|jsx)$/,
                exclude: /node_modules[\\/](?!@uupaa[\\/]dynamic-import-polyfill|blurhash|date-fns|epubjs|flv.js|libarchive.js|marked|react-router|screenfull)/,
                use: [{
                    loader: 'babel-loader',
                    options: {
                        cacheCompression: false,
                        cacheDirectory: true
                    }
                }]
            },
            {
                test: /\.worker\.ts$/,
                exclude: /node_modules/,
                use: [
                    'worker-loader',
                    'ts-loader'
                ]
            },
            {
                test: /\.(ts|tsx)$/,
                exclude: /node_modules/,
                use: [{
                    loader: 'ts-loader'
                }]
            },
            /* modules that Babel breaks when transforming to ESM */
            {
                test: /node_modules[\\/](pdfjs-dist|xmldom)[\\/].*\.js$/,
                use: [{
                    loader: 'babel-loader',
                    options: {
                        cacheCompression: false,
                        cacheDirectory: true,
                        plugins: [
                            '@babel/transform-modules-umd'
                        ]
                    }
                }]
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    DEV_MODE ? 'style-loader' : MiniCssExtractPlugin.loader,
                    'css-loader',
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                config: path.resolve(__dirname, 'postcss.config.js')
                            }
                        }
                    },
                    'sass-loader'
                ]
            },
            {
                test: /\.css$/i,
                use: [
                    DEV_MODE ? 'style-loader' : MiniCssExtractPlugin.loader,
                    'css-loader',
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                config: path.resolve(__dirname, 'postcss.config.js')
                            }
                        }
                    }
                ]
            },
            {
                test: /\.(png|jpg|gif|svg)$/i,
                type: 'asset/resource'
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/,
                type: 'asset/resource'
            },
            {
                test: /\.(mp3)$/i,
                type: 'asset/resource'
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

if (!DEV_MODE) {
    config.plugins.push(new MiniCssExtractPlugin());
}

module.exports = config;
