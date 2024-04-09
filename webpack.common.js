const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { DefinePlugin } = require('webpack');
const packageJson = require('./package.json');

const Assets = [
    'native-promise-only/npo.js',
    'libarchive.js/dist/worker-bundle.js',
    '@jellyfin/libass-wasm/dist/js/default.woff2',
    '@jellyfin/libass-wasm/dist/js/subtitles-octopus-worker.js',
    '@jellyfin/libass-wasm/dist/js/subtitles-octopus-worker.wasm',
    '@jellyfin/libass-wasm/dist/js/subtitles-octopus-worker-legacy.js',
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
            path.resolve(__dirname, 'src'),
            path.resolve(__dirname, 'node_modules')
        ],
        alias: {
            '@mui/base': '@mui/base/legacy',
            '@mui/lab': '@mui/lab/legacy',
            '@mui/material': '@mui/material/legacy',
            '@mui/private-theming': '@mui/private-theming/legacy',
            '@mui/styled-engine': '@mui/styled-engine/legacy',
            '@mui/system': '@mui/system/legacy',
            '@mui/utils': '@mui/utils/legacy',
            '@mui/x-data-grid': '@mui/x-data-grid/legacy'
        }
    },
    plugins: [
        new DefinePlugin({
            __JF_BUILD_VERSION__: JSON.stringify(
                process.env.WEBPACK_SERVE ?
                    'Dev Server' :
                    process.env.JELLYFIN_VERSION || 'Release'),
            __PACKAGE_JSON_NAME__: JSON.stringify(packageJson.name),
            __PACKAGE_JSON_VERSION__: JSON.stringify(packageJson.version),
            __USE_SYSTEM_FONTS__: JSON.stringify(!!process.env.USE_SYSTEM_FONTS),
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
        }),
        new ForkTsCheckerWebpackPlugin({
            typescript: {
                configFile: path.resolve(__dirname, 'tsconfig.json')
            }
        })
    ],
    output: {
        filename: pathData => (
            pathData.chunk.name === 'serviceworker' ? '[name].js' : '[name].bundle.js'
        ),
        chunkFilename: '[name].[contenthash].chunk.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: ''
    },
    optimization: {
        runtimeChunk: 'single',
        removeAvailableModules: false,
        removeEmptyChunks: false,
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
                        // if "packageName" is a namespace (i.e. @jellyfin) get the namespace + packageName
                        if (packageName.startsWith('@')) {
                            const parts = module.context
                                .substring(module.context.lastIndexOf(packageName))
                                .split(/[\\/]/);
                            return `node_modules.${parts[0]}.${parts[1]}`;
                        }

                        if (packageName === 'date-fns') {
                            const parts = module.context
                                .substring(module.context.lastIndexOf(packageName))
                                .split(/[\\/]/);

                            let name = `node_modules.${parts[0]}`;
                            if (parts[1]) {
                                name += `.${parts[1]}`;

                                if (parts[1] === 'locale' && parts[2]) {
                                    name += `.${parts[2]}`;
                                }
                            }

                            return name;
                        }

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
                test: /\.(js|jsx|mjs)$/,
                include: [
                    path.resolve(__dirname, 'node_modules/@jellyfin/libass-wasm'),
                    path.resolve(__dirname, 'node_modules/@jellyfin/sdk'),
                    path.resolve(__dirname, 'node_modules/@react-hook/latest'),
                    path.resolve(__dirname, 'node_modules/@react-hook/passive-layout-effect'),
                    path.resolve(__dirname, 'node_modules/@react-hook/resize-observer'),
                    path.resolve(__dirname, 'node_modules/@remix-run/router'),
                    path.resolve(__dirname, 'node_modules/@tanstack/match-sorter-utils'),
                    path.resolve(__dirname, 'node_modules/@tanstack/query-core'),
                    path.resolve(__dirname, 'node_modules/@tanstack/react-query'),
                    path.resolve(__dirname, 'node_modules/@uupaa/dynamic-import-polyfill'),
                    path.resolve(__dirname, 'node_modules/axios'),
                    path.resolve(__dirname, 'node_modules/blurhash'),
                    path.resolve(__dirname, 'node_modules/compare-versions'),
                    path.resolve(__dirname, 'node_modules/copy-anything'),
                    path.resolve(__dirname, 'node_modules/date-fns'),
                    path.resolve(__dirname, 'node_modules/dom7'),
                    path.resolve(__dirname, 'node_modules/epubjs'),
                    path.resolve(__dirname, 'node_modules/flv.js'),
                    path.resolve(__dirname, 'node_modules/is-what'),
                    path.resolve(__dirname, 'node_modules/libarchive.js'),
                    path.resolve(__dirname, 'node_modules/linkify-it'),
                    path.resolve(__dirname, 'node_modules/markdown-it'),
                    path.resolve(__dirname, 'node_modules/mdurl'),
                    path.resolve(__dirname, 'node_modules/punycode'),
                    path.resolve(__dirname, 'node_modules/react-blurhash'),
                    path.resolve(__dirname, 'node_modules/react-lazy-load-image-component'),
                    path.resolve(__dirname, 'node_modules/react-router'),
                    path.resolve(__dirname, 'node_modules/screenfull'),
                    path.resolve(__dirname, 'node_modules/ssr-window'),
                    path.resolve(__dirname, 'node_modules/swiper'),
                    path.resolve(__dirname, 'node_modules/usehooks-ts'),
                    path.resolve(__dirname, 'src')
                ],
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
                    {
                        loader: 'ts-loader',
                        options: {
                            transpileOnly: true
                        }
                    }
                ]
            },
            {
                test: /\.(ts|tsx)$/,
                exclude: /node_modules/,
                use: [{
                    loader: 'ts-loader',
                    options: {
                        transpileOnly: true
                    }
                }]
            },
            /* modules that Babel breaks when transforming to ESM */
            {
                test: /\.js$/,
                include: [
                    path.resolve(__dirname, 'node_modules/pdfjs-dist'),
                    path.resolve(__dirname, 'node_modules/xmldom')
                ],
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
