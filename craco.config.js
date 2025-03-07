const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: {
      resolve: {
        fallback: {
          "path": false,
          "os": false,
          "crypto": false,
          "stream": false,
          "buffer": false,
          "util": false,
          "assert": false,
          "http": false,
          "url": false,
          "https": false,
          "zlib": false,
          "process": false,
          "fs": false
        }
      }
    }
  }
}; 