// Quiesco 配置。只用 Release 构建（METHODOLOGY 2.2）：JS bundle 内嵌，不用 dev client / Metro。
// 构建产物由 ./build.sh 生成到 ./build（E2E_TOOL=quiesco、EXPO_PUBLIC_QUIESCO=1）。
import { defineConfig } from '@quiesco/core';

export default defineConfig({
  // app 与测试工程分开（0.8.0 起支持）：doctor / build / init --upgrade 在这里找 Expo app
  appDir: '../../app',
  apps: {
    ios: {
      bundleId: 'com.rnshootout.app',
      binaryPath: 'build/rnshootout.app',
    },
    android: {
      package: 'com.rnshootout.app',
      binaryPath: 'build/app-release.apk',
      // app 通过 localhost:4000 访问 mock server（adb reverse）
      reversePorts: [4000],
    },
  },
  devices: {
    ios: { device: 'iPhone 17', os: '27.0' },
    // C2 只在 GAPIS 镜像上检查（AOSP 镜像没有浏览器，METHODOLOGY 2.2）：ANDROID_AVD=Medium_Phone_API_36_GAPIS
    android: { avd: process.env.ANDROID_AVD ?? 'Medium_Phone_API_36_AOSP' },
  },
});
