// harness 的固定设置（METHODOLOGY 2.2、6、7）。改动这里的值需要开新的方法版本。
import path from 'node:path';
import os from 'node:os';

export const ROOT = path.resolve(import.meta.dirname, '../..');
export const RESULTS_RAW = path.join(ROOT, 'results', 'raw');
export const BUNDLE = 'com.rnshootout.app';
export const MOCK_URL = 'http://localhost:4000';

export const IOS = {
  deviceName: 'iPhone 17',
  osVersion: '27.0',
  runtimeId: 'com.apple.CoreSimulator.SimRuntime.iOS-27-0',
};

const SDK = process.env.ANDROID_HOME ?? path.join(os.homedir(), 'Library', 'Android', 'sdk');
export const ANDROID = {
  avd: 'Medium_Phone_API_36_AOSP',
  serial: 'emulator-5554',
  port: 5554,
  sdk: SDK,
  emulator: path.join(SDK, 'emulator', 'emulator'),
  adb: path.join(SDK, 'platform-tools', 'adb'),
  // 每次 Android 运行都以相同参数冷启动模拟器（METHODOLOGY 6.4）；slow-cpu 另加 -cores 2（METHODOLOGY 8.4）
  // -no-window：带窗口启动时窗口不在前台，macOS 把 qemu 限速为后台优先级（PRI 4，smoke 中 Android 慢 2–3 倍）；headless 为 PRI 31
  emulatorArgs: ['-no-snapshot-load', '-no-audio', '-no-window'],
};

/** 每个场景 ID 的规范写法与顺序（scenarios.md；正式版 / 诊断版共 24 个） */
export const SCENARIOS = [
  'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7a', 'S8', 'S9', 'S10a', 'S10b', 'S11',
  'S12', 'S13', 'S14', 'S15', 'S16', 'S17', 'S18', 'S19', 'S20', 'S21', 'S22', 'S23',
];

export const LIMITS = {
  // METHODOLOGY 6.5：整套运行的硬上限
  suiteTimeoutMs: 30 * 60_000,
  // 模拟器开机的上限（0.13.0 时曾停在 wait-for-device 约 3 小时）
  bootTimeoutMs: 300_000,
  // METHODOLOGY 6.4：开始前等宿主机 1 分钟 load average 降到阈值以下
  loadThreshold: Number(process.env.HARNESS_LOAD_THRESHOLD ?? 8),
  loadMaxWaitMs: 20 * 60_000,
  loadPollMs: 15_000,
};

export const STRESS_PROFILES = ['none', 'slow-net', 'slow-cpu', 'jitter'];
export const TOOLS = ['quiesco', 'detox', 'appium', 'maestro'];
export const PLATFORMS = ['ios', 'android'];
export const VARIANTS = ['final', 'diagnostic'];
