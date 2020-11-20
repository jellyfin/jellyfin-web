const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const packageConfig = require('./package.json');
const WorkboxPlugin = require('workbox-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    context: path.resolve(__dirname, 'src'),
    target: 'web',
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
                        ignore: ['**/css/*']
                    }
                },
                {
                    from: '*.*',
                    globOptions: {
                        ignore: ['**.js', '**.html']
                    }
                }
            ]
        }),
        new WorkboxPlugin.InjectManifest({
            swSrc: path.resolve(__dirname, 'src/serviceworker.js'),
            swDest: 'serviceworker.js'
        })
    ],
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist')
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
                exclude: /node_modules[\\/](?!date-fns|epubjs)/,
                use: [{
                    loader: 'babel-loader',
                    options: {
                        presets: packageConfig.babel.presets
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
