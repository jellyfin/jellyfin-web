const path = require('path');

module.exports = {
    context: path.resolve(__dirname, 'src'),
    entry: './bundle.js',
    resolve: {
        modules: [
            path.resolve(__dirname, 'node_modules')
        ]
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.(png|jpg|gif)$/i,
                use: ['file-loader']
            }
        ]
    },
};
