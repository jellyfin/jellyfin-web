const { merge } = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const common = require('./webpack.common');

// Scripts that server plugins add to the web UI. The server adds them to the
// index.html it sends, but the dev server sends its own, so load them from the
// connected server after sign-in (like the Tizen app's tizen.js does).
const SERVER_PLUGIN_SCRIPTS = ['QuickTag/ClientScript'];

const serverPluginLoader = `(function () {
    var scripts = ${JSON.stringify(SERVER_PLUGIN_SCRIPTS)};
    var loaded = false;
    function load() {
        var client = window.ApiClient;
        if (loaded || !client || !client.serverAddress() || !client.accessToken()) return;
        loaded = true;
        scripts.forEach(function (path) {
            var script = document.createElement('script');
            script.src = client.getUrl(path);
            script.onerror = function () { console.log('Server plugin script not available: ' + path); };
            document.head.appendChild(script);
        });
    }
    window.addEventListener('viewshow', load);
}());`;

class ServerPluginLoaderPlugin {
    apply(compiler) {
        compiler.hooks.compilation.tap('ServerPluginLoaderPlugin', compilation => {
            HtmlWebpackPlugin.getHooks(compilation).alterAssetTagGroups.tap('ServerPluginLoaderPlugin', data => {
                data.bodyTags.push(HtmlWebpackPlugin.createHtmlTagObject('script', {}, serverPluginLoader));
                return data;
            });
        });
    }
}

module.exports = merge(common, {
    // In order for live reload to work we must use "web" as the target not "browserslist"
    target: process.env.WEBPACK_SERVE ? 'web' : 'browserslist',
    mode: 'development',
    devtool: 'eval-cheap-module-source-map',
    module: {
        rules: [
            {
                test: /\.(js|jsx|ts|tsx)$/,
                exclude: /node_modules/,
                enforce: 'pre',
                use: ['source-map-loader']
            }
        ]
    },
    // Only on the dev server: built apps get plugin scripts from the server or tizen.js
    plugins: process.env.WEBPACK_SERVE ? [new ServerPluginLoaderPlugin()] : [],
    devServer: {
        compress: true,
        client: {
            // Live reload on the page's own host and port, which differ from the
            // server's when it runs in Docker with a port mapping
            webSocketURL: 'auto://0.0.0.0:0/ws',
            overlay: {
                errors: true,
                warnings: false,
                // jellyfin-web leaves promise rejections unhandled as a matter of course
                runtimeErrors: false
            }
        }
    }
});
