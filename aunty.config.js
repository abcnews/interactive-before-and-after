const path = require('path');

module.exports = {
  type: 'preact',
  devServer: {
    publicPath: '/',
    contentBase: path.resolve(__dirname, 'dist'),
    https: false
  }
};
