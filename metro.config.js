// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_classnames: false,
    keep_fnames: false,
    mangle: true,
    compress: {
      drop_console: true, // removes console.log in production
      drop_debugger: true,
      pure_funcs: ["console.log", "console.warn"],
    },
  },
};

module.exports = config;
