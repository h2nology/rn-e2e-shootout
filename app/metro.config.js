// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withQuiesco } = require('@quiesco/agent/metro');

// withQuiesco: the real agent when EXPO_PUBLIC_QUIESCO=1 (e2e builds), a no-op stub otherwise.
// nativeModules: wrap native modules for Quiesco's `native-module` tracker (h2nology/quiesco#67, #74).
// Only takes effect with EXPO_PUBLIC_QUIESCO=1: other tools' builds get the stub and are unaffected.
module.exports = withQuiesco(getDefaultConfig(__dirname), { nativeModules: true });
