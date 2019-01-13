const path = require('path');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
//const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const outputPath = 'dist';

var extractPlugin = new ExtractTextPlugin({
    filename: 'bundle.css'
});

module.exports = {
    entry: [path.join(__dirname, 'src', 'js', 'index.ts')],
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, outputPath)
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [
                    {
                        /*loader: 'awesome-typescript-loader',
                        options: {
                          useCache: true,
                          configFileName: 'tsconfig.json'
                        }*/
                        loader: 'ts-loader'
                        /*options: {
                          configFileName: 'tsconfig.json'
                        }*/
                    }
                ],
                exclude: /node_modules/
            },
            // {
            //     test: /\.css$/,
            //     use: extractPlugin.extract({
            //         fallback: 'style-loader',
            //         use: [
            //             { loader: 'css-loader', options: { importLoaders: 1 } },
            //         ]
            //     })
            // },
            {
                test: /\.(scss|css)$/,
                use: extractPlugin.extract({
                    fallback: 'style-loader',
                    use: [
                        { loader: 'css-loader', options: { importLoaders: 1 } },
                        { loader: 'sass-loader' }
                    ]
                })
            },
            // {
            //     test: /\.html$/,
            //     use: ['html-loader']
            // },
            {
                test: /\.(png|jpg|gif)$/,
                use: [{
                    loader: 'file-loader',
                    options: {
                        name: '[name].[ext]',
                        outputPath: 'img/',
                        publicPath: 'img/'
                    }
                }]
            },
            {
                test: /\.woff2?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                use: "url-loader"
            },
            {
                test: /\.(ttf|eot|svg)(\?[\s\S]+)?$/,
                use: 'file-loader'
            },
            { test: require.resolve('jquery'), loader: 'expose-loader?jQuery!expose-loader?$' }
        ]
    },
    plugins: [
        //When src requires are fixed, enbale these
        new webpack.ProvidePlugin({
            // $: "jquery",
            // jQuery: "jquery",
            // "window.jQuery": "jquery",
            // Tether: "tether",
            // "window.Tether": "tether",            
            // jstree: "js-tree/dist/tree.js"
        }),
        extractPlugin,
        //new HtmlWebpackPlugin({
        //    template: 'src/index.html',
         //   filename: 'index.html'
        //}),
        new CleanWebpackPlugin([outputPath+"/*"]),
        new CopyWebpackPlugin([
            { from: '*.html', to: './', context: 'src/'},
            { from: '*.json', to: './', context: 'src/'},
            { from: '*.txt', to: './' , context: 'src/'},
            { from: '*.ico', to: './' , context: 'src/'},
            { from: '*.png', to: './' , context: 'src/'},
            { from: 'strings/*.json', to: './' , context: 'src/'},
            { from: 'scripts/*.js', to: './' , context: 'src/'},
            { from: 'css/**/*', to: './' , context: 'src/'},
            { from: 'bower_components/**/*', to: './' , context: 'src/'},
            { from: 'components/**/*', to: './' , context: 'src/'},
            { from: 'dashboard/**/*', to: './' , context: 'src/'},
            { from: 'devices/**/*', to: './' , context: 'src/'},
            { from: 'home/**/*', to: './' , context: 'src/'},
            { from: 'legacy/**/*', to: './' , context: 'src/'},
            { from: 'list/**/*', to: './' , context: 'src/'},
            { from: 'thirdparty/**/*', to: './' , context: 'src/'},
          ])
    ],
    optimization: {
        minimizer: [
            new UglifyJSPlugin({
                uglifyOptions: {
                    output: {
                        comments: false
                    }
                }
            }),
        ]
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.json', '.scss', '.css']
    },
    devtool: 'source-map',
    devServer: {
        // publicPath: path.join('/dist')
    }
};