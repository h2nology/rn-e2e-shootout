// 由 `detox init` 生成后按本项目修改：只用 Release 构建（METHODOLOGY 2.2）。
// app 在 ../../app；构建前以 E2E_TOOL=detox 重新 prebuild，使 expo-detox-config-plugin 生效。
// 构建：./build.sh ios|android（产物复制到 ./build，避免被其他工具的 prebuild --clean 清掉）
const BUILD = './build';

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
      binaryPath: `${BUILD}/rnshootout.app`,
      build: './build.sh ios',
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: `${BUILD}/app-release.apk`,
      testBinaryPath: `${BUILD}/app-release-androidTest.apk`,
      build: './build.sh android',
      reversePorts: [4000],
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      // 测量专用设备（METHODOLOGY 2 v16）：iPhone 17 / iOS 27.0
      device: { name: 'Shootout iPhone 17', os: 'iOS 27.0' },
    },
    emulator: {
      type: 'android.emulator',
      device: { avdName: 'Shootout_API_36_AOSP' },
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
