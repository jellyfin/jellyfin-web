const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    context: path.resolve(__dirname, "src"),
    entry: "./bundle.js",
    resolve: {
        modules: [
            path.resolve(__dirname, "node_modules")
        ]
    },
    plugins: [
        new CopyPlugin([
            {
                from: "**/*",
                to: "."
            },
            {
                from: "../node_modules/libass-wasm/dist/subtitles-octopus-worker.*",
                to: "JavascriptSubtitlesOctopus",
                transformPath(targetPath, absolutePath) {
                    return Promise.resolve(path.join("JavascriptSubtitlesOctopus", path.basename(targetPath)));
                }
            }
        ])
    ]
};
