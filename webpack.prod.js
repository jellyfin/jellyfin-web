const common = require('./webpack.common');
const merge = require('webpack-merge');
const packageConfig = require('./package.json');

module.exports = merge(common, {
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules[\\/](?!date-fns|epubjs|jellyfin-apiclient|query-string|split-on-first|strict-uri-encode|xmldom)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: packageConfig.babel.presets
                    }
                }
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
                test: /\.(png|jpg|gif)$/i,
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
            }
        ]
    }
});
