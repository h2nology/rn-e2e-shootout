// 四个工具的适配：版本、构建、构建产物、测试命令、JUnit 输出目录。
// 各工具的测试命令与 M3 相同（suites/<tool>/RESULTS.md）；harness 先安装 app，工具不再重装（能跳过的都跳过）。
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './config.mjs';
import { run } from './sh.mjs';

const suite = (t) => path.join(ROOT, 'suites', t);
const pkgVersion = (dir, name) => JSON.parse(fs.readFileSync(path.join(dir, 'node_modules', name, 'package.json'), 'utf8')).version;

export const TOOL_ADAPTERS = {
  quiesco: {
    dir: suite('quiesco'),
    async version() {
      return pkgVersion(this.dir, 'quiesco');
    },
    binaries: {
      ios: ['build/Build/Products/Release-iphonesimulator/rnshootout.app'],
      android: ['build/app-release.apk'],
    },
    build: (p) => ({ cmd: 'npm', args: ['run', `build:${p}`] }),
    // quiesco test 在会话开始时安装 binaryPath 的构建（已安装同一构建时的行为见 launchMs）
    test: (p, variant) => ({ cmd: 'npx', args: ['quiesco', 'test', '--platform', p], env: { VARIANT: variant } }),
    junitDir: (p, v) => `reports/${p}-${v}`,
  },
  detox: {
    dir: suite('detox'),
    async version() {
      return pkgVersion(this.dir, 'detox');
    },
    binaries: {
      ios: ['build/rnshootout.app'],
      android: ['build/app-release.apk', 'build/app-release-androidTest.apk'],
    },
    build: (p) => ({ cmd: './build.sh', args: [p] }),
    // --reuse：不卸载重装（harness 已安装）。Android 按 adb 名称连接已启动的模拟器（.detoxrc.js 的 android.att.release）
    test: (p, variant) => ({
      cmd: 'npx',
      args: ['detox', 'test', '-c', p === 'ios' ? 'ios.sim.release' : 'android.att.release', '--reuse'],
      env: { VARIANT: variant, PLATFORM: p },
    }),
    junitDir: (p, v) => `reports/${p}-${v}`,
  },
  appium: {
    dir: suite('appium'),
    async version() {
      const d = this.dir;
      return `${pkgVersion(d, 'appium')} (xcuitest ${pkgVersion(d, 'appium-xcuitest-driver')}, uiautomator2 ${pkgVersion(d, 'appium-uiautomator2-driver')}, webdriverio ${pkgVersion(d, 'webdriverio')})`;
    },
    binaries: {
      ios: ['build/rnshootout.app'],
      android: ['build/app-release.apk'],
    },
    build: (p) => ({ cmd: './build.sh', args: [p] }),
    // noReset + 已安装同版本时 XCUITest / UiAutomator2 driver 不重装
    test: (p, variant) => ({ cmd: 'npx', args: ['wdio', 'run', 'wdio.conf.js'], env: { PLATFORM: p, VARIANT: variant } }),
    junitDir: (p, v) => `reports/${p}-${v}`,
  },
  maestro: {
    dir: suite('maestro'),
    async version() {
      return (await run('maestro', ['--version'])).trim().split('\n').pop();
    },
    binaries: {
      ios: ['build/rnshootout.app'],
      android: ['build/app-release.apk'],
    },
    build: (p) => ({ cmd: './build.sh', args: [p] }),
    // SKIP_INSTALL：run.sh 不再安装（harness 已安装）
    test: (p, variant, dev) => ({
      cmd: './run.sh',
      args: [],
      env: { PLATFORM: p, VARIANT: variant, SKIP_INSTALL: '1', ...(dev.udid ? { IOS_UDID: dev.udid } : {}) },
    }),
    junitDir: (p, v) => `reports/${p}-${v}`,
  },
};

export function binaryPaths(tool, platform) {
  const a = TOOL_ADAPTERS[tool];
  return a.binaries[platform].map((b) => path.join(a.dir, b));
}
