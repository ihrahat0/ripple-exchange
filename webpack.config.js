module.exports = {
  // ... other config
  resolve: {
    fallback: {
      "assert": false,
      "process": false,
      "fs": false,
      "os": false,
      "path": false,
      "util": false
    }
  }
}; 