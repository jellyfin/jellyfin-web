const path = require("path");
const { CleanWebpackPlugin} = require("clean-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const Assets = [
    "alameda/alameda.js",
    "requirejs/require.js"
];

module.exports = {
    context: path.resolve(__dirname, "src"),
    entry: "./bundle.js",
    resolve: {
        modules: [
            path.resolve(__dirname, "node_modules")
        ]
    },
    plugins: [
        new CleanWebpackPlugin(),
        new CopyPlugin([{
            from: "**/*",
            to: "."
        }]),
        new CopyPlugin(
            Assets.map(asset => {
                return {
                    from: path.resolve(__dirname, `./node_modules/${asset}`),
                    to: path.resolve(__dirname, './dist/libraries')
                };
            })
        )
    ]
};
