import { merge } from 'webpack-merge';

import common from './webpack.common.js';

export default merge(common, {
    mode: 'production',
    entry: {
        ...common.entry,
        'serviceworker': './serviceworker.js'
    }
});
