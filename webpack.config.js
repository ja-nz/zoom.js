var path = require('path');

module.exports = {
    entry: path.resolve(__dirname, 'src/zoom.js'),
    output: {
        filename: 'zoom.js',
        path: path.resolve(__dirname, 'dist')
    },
};
