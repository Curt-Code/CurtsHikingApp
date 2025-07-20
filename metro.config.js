const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  server: {
    // Enable network access for cross-machine development
    host: '0.0.0.0',
    port: 8081,
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
