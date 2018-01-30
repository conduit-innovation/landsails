const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './lib/index.js',
  output: {
    libraryTarget: 'umd',
    filename: 'landsails-bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  resolve: {
    alias: {
      'fs': path.resolve(__dirname, 'lib/shims/bfs-fs-stream-override.js'),
      'buffer': 'browserfs/dist/shims/buffer.js',
      'path': 'browserfs/dist/shims/path.js',
      'processGlobal': 'browserfs/dist/shims/process.js',
      'bufferGlobal': 'browserfs/dist/shims/bufferGlobal.js',
      'bfsGlobal': require.resolve('browserfs'),
      'machinepack-fs': 'machinepack-static-fs',
      'machine': 'machine-static'
    }
  },
  module: {
    loaders: [
      {
        loader: 'babel-loader',
        test: path.resolve(__dirname, 'js'),
            }
        ]
  },
  plugins: [
    // Expose BrowserFS, process, and Buffer globals.
    // NOTE: If you intend to use BrowserFS in a script tag, you do not need
    // to expose a BrowserFS global.
    new webpack.ProvidePlugin({ BrowserFS: 'bfsGlobal', process: 'processGlobal', Buffer: 'bufferGlobal' })
  ],
  // DISABLE Webpack's built-in process and Buffer polyfills!
  node: {
    process: false,
    Buffer: false,
    __dirname: true
  },
  module: {
      noParse: /browserfs\.js/
    },
  devtool: "cheap-module-eval-source-map",
  watch: true
};
