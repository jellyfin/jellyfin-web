import SpeedMeasurePlugin from 'speed-measure-webpack-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { merge } from 'webpack-merge';

import prod from './webpack.prod.js';

const smp = new SpeedMeasurePlugin();

const config = merge(prod, {
    plugins: [
        new BundleAnalyzerPlugin({
            excludeAssets: /-json\..*\.chunk\.js$/
        })
    ]
});

const searchPlugin = (name) => config.plugins.findIndex((e) => e.constructor.name === name);

// NOTE: We need to re-add the mini css plugin to workaround this issue
// https://github.com/stephencookdev/speed-measure-webpack-plugin/issues/167
const miniCssPluginIndex = searchPlugin('MiniCssExtractPlugin');
const miniCssPlugin = config.plugins[miniCssPluginIndex];

const exportedConfig = smp.wrap(config);

exportedConfig.plugins[miniCssPluginIndex] = miniCssPlugin;

export default exportedConfig;
