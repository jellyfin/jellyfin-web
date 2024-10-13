import { Configuration } from 'webpack';
import { merge } from 'webpack-merge';

import commonConfig from './webpack.common';

const prodConfig: Configuration = {
    mode: 'production',
    entry: {
        'main.jellyfin': './index.jsx',
        'serviceworker': './serviceworker.js'
    }
};

export default merge(commonConfig, prodConfig);
