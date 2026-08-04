const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Exclude web build artifacts and temp directories from Metro file watcher to prevent ENOENT crashes
config.resolver.blockList = [
  /apps\/web\/\.netlify\/.*/,
  /apps\/web\/dist\/.*/,
  /apps\/web\/\.next\/.*/,
];

module.exports = withNativeWind(config, { input: './src/global.css' });
