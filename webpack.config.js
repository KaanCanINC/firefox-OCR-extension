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
  mode: 'production'
};
