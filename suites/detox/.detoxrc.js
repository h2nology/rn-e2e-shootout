// 由 `detox init` 生成后按本项目修改：只用 Release 构建（METHODOLOGY 2.2）。
// app 在 ../../app；构建前以 E2E_TOOL=detox 重新 prebuild，使 expo-detox-config-plugin 生效。
const APP = '../../app';
const PREBUILD = `cd ${APP} && E2E_TOOL=detox CI=1 npx expo prebuild --clean --no-install`;

/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    'ios.release': {
      type: 'ios.app',
      binaryPath: `${APP}/ios/build-detox/Build/Products/Release-iphonesimulator/rnshootout.app`,
      build: `${PREBUILD} --platform ios && cd ios && pod install && xcodebuild -workspace rnshootout.xcworkspace -scheme rnshootout -configuration Release -sdk iphonesimulator -derivedDataPath build-detox`,
    },
    // -Xmx4g：Expo 生成的 gradle.properties 默认 2 GB，R8 压缩测试 APK 时 OOM（实测）
    'android.release': {
      type: 'android.apk',
      binaryPath: `${APP}/android/app/build/outputs/apk/release/app-release.apk`,
      testBinaryPath: `${APP}/android/app/build/outputs/apk/androidTest/release/app-release-androidTest.apk`,
      build: `${PREBUILD} --platform android && cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release -Dorg.gradle.jvmargs=-Xmx4g`,
      reversePorts: [4000],
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: { type: 'iPhone 17', os: 'iOS 27.0' },
    },
    emulator: {
      type: 'android.emulator',
      device: { avdName: 'Medium_Phone_API_36_AOSP' },
    },
    // emulator 37.2 下 Detox 通过 telnet 查询模拟器控制台超时（“response not received”，控制台需认证），
    // 改用模板中的 android.attached，按 adb 名称直接连接已启动的模拟器。
    attached: {
      type: 'android.attached',
      device: { adbName: 'emulator-5554' },
    },
  },
  configurations: {
    'ios.sim.release': { device: 'simulator', app: 'ios.release' },
    'android.emu.release': { device: 'emulator', app: 'android.release' },
    'android.att.release': { device: 'attached', app: 'android.release' },
  },
};
