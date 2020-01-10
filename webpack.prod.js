const path = require("path");
const common = require("./webpack.common");
const merge = require("webpack-merge");

module.exports = merge(common, {
    mode: "production",
    devtool: "source-map",
    module: {
        rules: [
            {
                test: /\.(html)$/,
                use: {
                    loader: 'html-loader',
                    options: {
                        attrs: false
                    }
                }
            },
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader?sourceMap", "postcss-loader"]
            },
            {
                test: /\.(png|jpg|gif)$/i,
                use: ["file-loader"]
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/,
                use: [
                    'file-loader',
                ]
            }
        ]
    }
});
