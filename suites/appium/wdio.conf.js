// WebdriverIO 测试运行器配置（Appium 4 + XCUITest / UiAutomator2）。
// 只用 Release 构建（METHODOLOGY 2.2）。平台由 PLATFORM=ios|android 选择，版本由 VARIANT=diagnostic|final 选择。
// 构建产物由 build.sh 生成到 ./build（不带任何工具叠加：E2E_TOOL=none）。
import path from 'node:path';
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const PLATFORM = process.env.PLATFORM ?? 'ios';
const VARIANT = process.env.VARIANT ?? 'final';
const BUILD = path.resolve(import.meta.dirname, 'build');
export const BUNDLE = 'com.rnshootout.app';

const capabilities = {
  ios: {
    platformName: 'iOS',
    'appium:automationName': 'XCUITest',
    // 测量专用设备（METHODOLOGY 2 v16）：iPhone 17 / iOS 27.0
    'appium:deviceName': 'Shootout iPhone 17',
    'appium:platformVersion': '27.0',
    'appium:app': `${BUILD}/rnshootout.app`,
    'appium:bundleId': BUNDLE,
    // 状态重置由 test/support.js 在每个场景前执行（METHODOLOGY 5），会话本身不清数据、不自动启动 app
    'appium:noReset': true,
    'appium:autoLaunch': false,
  },
  android: {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:udid': process.env.ANDROID_SERIAL ?? 'emulator-5554',
    'appium:app': `${BUILD}/app-release.apk`,
    'appium:appPackage': BUNDLE,
    'appium:appActivity': '.MainActivity',
    'appium:noReset': true,
    'appium:autoLaunch': false,
  },
}[PLATFORM];

export const config = {
  runner: 'local',
  port: 4723,
  // 固定按文件名（场景编号）顺序执行（METHODOLOGY 6.3）
  specs: process.env.SPEC
    ? [process.env.SPEC]
    : fs.readdirSync(path.join(import.meta.dirname, 'test', VARIANT)).filter((f) => f.endsWith('.js')).sort().map((f) => `./test/${VARIANT}/${f}`),
  maxInstances: 1,
  capabilities: [capabilities],
  logLevel: 'warn',
  // 自动重试全部关闭（METHODOLOGY 6.1）
  specFileRetries: 0,
  bail: 0,
  services: [['appium', { logPath: './logs' }]],
  framework: 'mocha',
  // harness 计时标记的 root hook（test/harness.js）
  mochaOpts: { ui: 'bdd', timeout: 60000, retries: 0, require: [path.join(import.meta.dirname, 'test', 'harness.js')] },
  // Android 模拟器内的 app 通过 localhost:4000 访问 mock server，需要 adb reverse。
  // Appium 没有对应的 capability（Detox 有 reversePorts），用外部命令补齐。
  onPrepare() {
    if (PLATFORM === 'android') {
      execSync(`adb -s ${capabilities['appium:udid']} reverse tcp:4000 tcp:4000`);
    }
  },
  // 失败时保存截图与 page source（只用于排查，不影响结果）
  async afterTest(test, _ctx, { error }) {
    if (!error) return;
    const name = `./logs/fail-${PLATFORM}-${test.parent}-${Date.now()}`.replace(/\s+/g, '_');
    await driver.saveScreenshot(`${name}.png`).catch(() => {});
    await driver.getPageSource().then((s) => fs.writeFileSync(`${name}.xml`, s)).catch(() => {});
  },
  reporters: [
    'spec',
    ['junit', { outputDir: `./reports/${PLATFORM}-${VARIANT}`, outputFileFormat: (o) => `results-${o.cid}.xml` }],
  ],
};
