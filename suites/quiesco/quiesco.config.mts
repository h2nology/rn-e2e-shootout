// Quiesco 配置。只用 Release 构建（METHODOLOGY 2.2）：JS bundle 内嵌，不用 dev client / Metro。
// 构建：npx quiesco build ios|android --clean（0.9.0 起不再需要自写脚本）。
// Release 由 binaryPath 决定：iOS 取路径中的 <Configuration>-iphonesimulator，Android 路径含 release 时 assembleRelease。
import { defineConfig } from '@quiesco/core';

export default defineConfig({
  // app 与测试工程分开（0.8.0 起支持）：doctor / build / init --upgrade 在这里找 Expo app
  appDir: '../../app',
  apps: {
    ios: {
      bundleId: 'com.rnshootout.app',
      binaryPath: 'build/Build/Products/Release-iphonesimulator/rnshootout.app',
    },
    android: {
      package: 'com.rnshootout.app',
      binaryPath: 'build/app-release.apk',
      // app 通过 localhost:4000 访问 mock server（adb reverse）
      reversePorts: [4000],
    },
  },
  // native-module tracker：await 原生模块 Promise 期间（如登录后的 AsyncStorage.setItem）也算忙碌（h2nology/quiesco#67）。
  // 0.12.0 起只要 app 侧 withQuiesco(config, { nativeModules: true })（app/metro.config.js）就默认开启（#94），这里不需设置。
  // 阈值、忽略列表（含等待用户操作的调用的默认忽略列表，#93）用默认值。
  // S22 的前置“通知权限已预先授权”（scenarios.md）。0.13.4 起 iOS 模拟器也支持（h2nology/quiesco#113）：
  // 会话开始时 install 之后、app 启动之前写入通知设置并重启 SpringBoard（已允许则跳过）。Android：pm grant。
  permissions: ['notifications'],
  // 按环节分析耗时时（findings.md “iOS 比 Android 慢的原因”）全部场景写 timeline：QUIESCO_TIMELINE=all。
  // 正式测量不设（默认只在失败时写），视频不录
  ...(process.env.QUIESCO_TIMELINE === 'all' ? { artifacts: { timeline: 'all' as const } } : {}),
  devices: {
    ios: { device: 'iPhone 17', os: '27.0' },
    // C2 只在 GAPIS 镜像上检查（AOSP 镜像没有浏览器，METHODOLOGY 2.2）：ANDROID_AVD=Medium_Phone_API_36_GAPIS
    android: { avd: process.env.ANDROID_AVD ?? 'Medium_Phone_API_36_AOSP' },
  },
});
