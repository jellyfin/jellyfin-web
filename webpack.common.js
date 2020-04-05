const path = require("path");

const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");

const Assets = [
    "alameda/alameda.js",
    "native-promise-only/npo.js",
    "libass-wasm/dist/js/subtitles-octopus-worker.js",
    "libass-wasm/dist/js/subtitles-octopus-worker.data",
    "libass-wasm/dist/js/subtitles-octopus-worker.wasm",
    "libass-wasm/dist/js/subtitles-octopus-worker-legacy.js",
    "libass-wasm/dist/js/subtitles-octopus-worker-legacy.data",
    "libass-wasm/dist/js/subtitles-octopus-worker-legacy.js.mem"
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
                    to: path.resolve(__dirname, "./dist/libraries")
                };
            })
        )
    ]
};
