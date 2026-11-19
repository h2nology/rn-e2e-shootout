// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withQuiesco } = require('@quiesco/agent/metro');

// withQuiesco: the real agent when EXPO_PUBLIC_QUIESCO=1 (e2e builds), a no-op stub otherwise.
module.exports = withQuiesco(getDefaultConfig(__dirname));
