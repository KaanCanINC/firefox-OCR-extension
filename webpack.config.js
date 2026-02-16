const path = require('path');

module.exports = {
  entry: {
    content: './src/content.js',
    background: './src/background.js',
    settings_page: './src/entry_settings.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  mode: 'production',
  resolve: {
    fallback: {
      "stream": false,
      "buffer": false,
      "util": false,
      "url": false,
      "https": false,
      "http": false,
      "zlib": false,
      "os": false,
      "child_process": false,
      "fs": false,
      "net": false,
      "tls": false
    },
    alias: {
      "got": path.resolve(__dirname, 'src/utils/got-shim.js')
    }
  }
};
