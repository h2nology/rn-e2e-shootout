// 模拟器控制（METHODOLOGY 6.3 / 6.4）：同一时刻只运行一个模拟器；每次套件运行前重启；设置并记录设备环境；安装 app。
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { run, sleep, spawnDetached, waitFor } from './sh.mjs';
import { ANDROID, BUNDLE, IOS, LIMITS } from './config.mjs';

// ---------- iOS ----------

async function simDevices() {
  const out = await run('xcrun', ['simctl', 'list', 'devices', '-j']);
  return JSON.parse(out).devices;
}

export async function iosUdid() {
  const devices = await simDevices();
  const list = devices[IOS.runtimeId] ?? [];
  const d = list.find((x) => x.name === IOS.deviceName && x.isAvailable);
  if (!d) throw new Error(`no available simulator "${IOS.deviceName}" on ${IOS.runtimeId}`);
  return d.udid;
}

async function bootedSims() {
  const devices = await simDevices();
  return Object.values(devices).flat().filter((d) => d.state === 'Booted').map((d) => d.udid);
}

async function shutdownAllSims() {
  for (const u of await bootedSims()) await run('xcrun', ['simctl', 'shutdown', u], { allowFail: true, timeoutMs: 120_000 });
}

const EN_KEYBOARD = 'en_US@sw=QWERTY;hw=Automatic';

/**
 * 当前键盘恢复为英文（关机状态下直接改 plist，开机后 cfprefsd 读到的就是新值）。
 * 系统记住上次使用的键盘：S7b 能力检查后停在日文罗马字键盘时，typeText 变成输入法组字（Detox 登录失败）、
 * Maestro hideKeyboard 失败（smoke 实测）。登记的键盘列表（AppleKeyboards，S7b 用）不动。
 */
function resetIosKeyboard(udid) {
  const f = `${process.env.HOME}/Library/Developer/CoreSimulator/Devices/${udid}/data/Library/Preferences/com.apple.keyboard.preferences.plist`;
  if (!fs.existsSync(f)) return;
  const set = (args) => execFileSync('plutil', [...args, f]);
  set(['-replace', 'KeyboardLastUsed', '-string', EN_KEYBOARD]);
  set(['-replace', 'KeyboardsCurrentAndNext', '-json', JSON.stringify([EN_KEYBOARD, EN_KEYBOARD])]);
}

/**
 * 语言 / 地区在关机状态下写入全局偏好（开机后写的值要到下次开机才对系统 UI 生效）。
 * 2026-11-24 新建的专用模拟器第一次开机时系统 UI 是日文（宿主机语言），S10b 找不到 “Allow While Using App”。
 */
function presetIosLocale(udid) {
  const f = `${process.env.HOME}/Library/Developer/CoreSimulator/Devices/${udid}/data/Library/Preferences/.GlobalPreferences.plist`;
  if (!fs.existsSync(f)) {
    fs.mkdirSync(f.slice(0, f.lastIndexOf('/')), { recursive: true });
    execFileSync('plutil', ['-create', 'binary1', f]);
  }
  execFileSync('plutil', ['-replace', 'AppleLanguages', '-json', '["en"]', f]);
  execFileSync('plutil', ['-replace', 'AppleLocale', '-string', 'en_US', f]);
}

/**
 * PosterBoard（锁屏 / 壁纸）的数据在关机状态下删除，开机时重建（METHODOLOGY 6.4 v18）。
 * 2026-11-23 旧模拟器、2026-11-24 专用模拟器各损坏一次（`PRPosterDescriptor _initWithPath` 断言），
 * 之后每次开机都崩溃循环，SpringBoard 重启后的稳定时间 5–6 s → 16 s。诱因未确定（只有 Quiesco 会重启 SpringBoard）。
 * v17 每次开机前都删除，但重建时 PosterBoard 本身约 1/4 的开机会崩溃 1–3 次（addNewVersionWithContents，
 * m5-final-none 37 次中 9 次）→ v18 只在上次开机以来有系统 UI 崩溃时删除。
 */
function resetPosterBoard(udid) {
  fs.rmSync(`${simData(udid)}/Library/Application Support/PRBPosterExtensionDataStore`, {
    recursive: true,
    force: true,
  });
}

const simData = (udid) => `${process.env.HOME}/Library/Developer/CoreSimulator/Devices/${udid}/data`;
// 上次开机的时刻（harness 写入；进程重启后也能判断上次开机以来有没有崩溃）
const lastBootFile = (udid) => `${simData(udid)}/.shootout-last-boot`;

/** 上次开机以来有系统 UI 进程崩溃 → 删除 PosterBoard 数据。返回是否删除了。 */
function resetPosterBoardIfCrashed(udid, log) {
  let since;
  try {
    since = new Date(fs.readFileSync(lastBootFile(udid), 'utf8').trim());
  } catch {
    return false;
  }
  if (Number.isNaN(since.getTime())) return false;
  const crashes = iosSystemCrashesSince(udid, since);
  if (crashes.length === 0) return false;
  log(`system UI crashed since last boot (${[...new Set(crashes.map((c) => c.process))].join(', ')} × ${crashes.length}); resetting PosterBoard data`);
  resetPosterBoard(udid);
  return true;
}

// 系统 UI 进程：运行期间崩溃则该次运行无效（METHODOLOGY 6.4 v17）。其他守护进程（assistantd 等）每次开机都可能崩溃，不算
const SYSTEM_UI_PROCESSES = ['PosterBoard', 'SpringBoard', 'backboardd'];

/** since 之后目标模拟器上系统 UI 进程的崩溃报告：[{ process, time, file }]。 */
export function iosSystemCrashesSince(udid, since) {
  const dir = `${process.env.HOME}/Library/Logs/DiagnosticReports`;
  let files;
  try {
    files = fs.readdirSync(dir);
  } catch {
    return [];
  }
  const out = [];
  for (const f of files) {
    const proc = SYSTEM_UI_PROCESSES.find((p) => f.startsWith(`${p}-`) && f.endsWith('.ips'));
    if (!proc) continue;
    const p = `${dir}/${f}`;
    let st;
    try {
      st = fs.statSync(p);
    } catch {
      continue;
    }
    if (st.mtimeMs < since.getTime()) continue;
    const text = fs.readFileSync(p, 'utf8');
    if (!text.includes(`com.apple.CoreSimulator.SimDevice.${udid}`)) continue;
    const m = text.match(/"captureTime" : "(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})\.\d+ ([+-]\d{2})(\d{2})"/);
    const time = m ? new Date(`${m[1]}T${m[2]}${m[3]}:${m[4]}`) : new Date(st.mtimeMs);
    if (time < since) continue;
    out.push({ process: proc, time: time.toISOString(), file: f });
  }
  return out.sort((a, b) => a.time.localeCompare(b.time));
}

/** iOS：关闭 Android 模拟器与其他 iOS 模拟器，重启目标模拟器，设置环境。返回设备信息。 */
export async function prepareIos(log) {
  await killEmulator(log);
  const udid = await iosUdid();
  for (const u of await bootedSims()) if (u !== udid) await run('xcrun', ['simctl', 'shutdown', u], { allowFail: true });
  const t0 = Date.now();
  await run('xcrun', ['simctl', 'shutdown', udid], { allowFail: true, timeoutMs: 120_000 });
  resetIosKeyboard(udid);
  presetIosLocale(udid);
  const posterBoardReset = resetPosterBoardIfCrashed(udid, log);
  fs.writeFileSync(lastBootFile(udid), new Date().toISOString() + '\n');
  await run('xcrun', ['simctl', 'boot', udid], { timeoutMs: 120_000 });
  await run('xcrun', ['simctl', 'bootstatus', udid, '-b'], { timeoutMs: LIMITS.bootTimeoutMs });
  const rebootMs = Date.now() - t0;
  // 设备环境（METHODOLOGY 6.4）：语言 / 地区 en / en_US，关闭减弱动态效果，浅色外观
  const sp = (args) => run('xcrun', ['simctl', 'spawn', udid, ...args]);
  await sp(['defaults', 'write', '-g', 'AppleLanguages', '-array', 'en']);
  await sp(['defaults', 'write', '-g', 'AppleLocale', '-string', 'en_US']);
  await sp(['defaults', 'write', 'com.apple.Accessibility', 'ReduceMotionEnabled', '-bool', 'false']);
  await run('xcrun', ['simctl', 'ui', udid, 'appearance', 'light']);
  const env = {
    languages: (await sp(['defaults', 'read', '-g', 'AppleLanguages'])).replace(/\s+/g, ''),
    locale: (await sp(['defaults', 'read', '-g', 'AppleLocale'])).trim(),
    reduceMotion: (await sp(['defaults', 'read', 'com.apple.Accessibility', 'ReduceMotionEnabled'])).trim(),
    appearance: (await run('xcrun', ['simctl', 'ui', udid, 'appearance'])).trim(),
    keyboardLastUsed: (await sp(['defaults', 'read', 'com.apple.keyboard.preferences', 'KeyboardLastUsed']).catch(() => '')).trim(),
  };
  log(`iOS ${udid} rebooted in ${rebootMs} ms; env ${JSON.stringify(env)}`);
  return { udid, rebootMs, env: { ...env, posterBoardReset }, device: `${IOS.deviceName} / iOS ${IOS.osVersion} simulator (${udid})` };
}

/** iOS：卸载后安装（installMs 只计安装）。 */
export async function installIos(udid, appPath) {
  await run('xcrun', ['simctl', 'uninstall', udid, BUNDLE], { allowFail: true });
  const t0 = Date.now();
  await run('xcrun', ['simctl', 'install', udid, appPath], { timeoutMs: 300_000 });
  return Date.now() - t0;
}

// ---------- Android ----------

const adb = (args, opts) => run(ANDROID.adb, ['-s', ANDROID.serial, ...args], opts);

async function emulatorPids() {
  const out = await run('pgrep', ['-f', `qemu-system.*-avd ${ANDROID.avd}`], { allowFail: true });
  return out.split('\n').filter(Boolean);
}

/**
 * harness 管理之外的 Android 模拟器（其他 AVD）。METHODOLOGY 6.4：同一时刻只运行一个模拟器。
 * 不是 harness 启动的，不替用户结束 → 作为环境错误停止（2026-11-24：带窗口的 API 37 模拟器在冒烟期间一直运行）。
 */
export async function assertNoForeignEmulators() {
  const out = await run('pgrep', ['-fl', 'qemu-system'], { allowFail: true });
  const foreign = out
    .split('\n')
    .filter(Boolean)
    .filter((l) => !l.includes(`-avd ${ANDROID.avd}`));
  if (foreign.length > 0) {
    const avds = foreign.map((l) => l.match(/-avd (\S+)/)?.[1] ?? l.split(' ')[0]);
    throw new Error(`other Android emulators are running (${avds.join(', ')}); close them first (METHODOLOGY 6.4: one simulator at a time)`);
  }
}

export async function killEmulator(log) {
  if ((await emulatorPids()).length === 0) return;
  log?.('stopping Android emulator');
  await adb(['emu', 'kill'], { allowFail: true, timeoutMs: 30_000 });
  try {
    await waitFor(async () => (await emulatorPids()).length === 0, { timeoutMs: 60_000, intervalMs: 1000, what: 'emulator exit' });
  } catch {
    for (const pid of await emulatorPids()) await run('kill', ['-9', pid], { allowFail: true });
    await sleep(2000);
  }
}

/**
 * Android：关闭 iOS 模拟器，以固定参数冷启动 Android 模拟器（cores 指定时加 -cores），等开机完成，设置环境。
 */
export async function prepareAndroid(log, { cores, logFile } = {}) {
  await shutdownAllSims();
  await killEmulator(log);
  const args = ['-avd', ANDROID.avd, '-port', String(ANDROID.port), ...ANDROID.emulatorArgs, ...(cores ? ['-cores', String(cores)] : [])];
  const t0 = Date.now();
  spawnDetached(ANDROID.emulator, args, { logFile });
  await waitFor(async () => (await adb(['shell', 'getprop', 'sys.boot_completed'], { timeoutMs: 10_000 })).trim() === '1', {
    timeoutMs: LIMITS.bootTimeoutMs,
    intervalMs: 2000,
    what: `${ANDROID.serial} boot`,
  });
  await sleep(5000); // 开机后系统服务仍在启动（reboot-android.sh 同样等 5 s）
  const rebootMs = Date.now() - t0;
  // 设备环境（METHODOLOGY 6.4）：动画缩放 1.0、浅色、语言 en-US
  for (const k of ['window_animation_scale', 'transition_animation_scale', 'animator_duration_scale']) {
    await adb(['shell', 'settings', 'put', 'global', k, '1.0']);
  }
  await adb(['shell', 'cmd', 'uimode', 'night', 'no']);
  let locale = await androidLocale();
  if (locale !== 'en-US') {
    // persist.sys.locale 需要 root（AOSP 镜像可用 adb root），重启 framework 后生效
    log(`Android locale is ${locale || '(unset)'}, setting en-US`);
    await run(ANDROID.adb, ['-s', ANDROID.serial, 'root'], { allowFail: true });
    await sleep(3000);
    await adb(['shell', 'setprop', 'persist.sys.locale', 'en-US']);
    await adb(['shell', 'setprop', 'ctl.restart', 'zygote']);
    await waitFor(async () => (await adb(['shell', 'getprop', 'sys.boot_completed'], { timeoutMs: 10_000 })).trim() === '1', {
      timeoutMs: LIMITS.bootTimeoutMs,
      what: 'framework restart',
    });
    await sleep(5000);
    locale = await androidLocale();
  }
  const env = {
    locale,
    animationScales: (await Promise.all(['window_animation_scale', 'transition_animation_scale', 'animator_duration_scale'].map((k) => adb(['shell', 'settings', 'get', 'global', k])))).map((s) => s.trim()).join('/'),
    nightMode: (await adb(['shell', 'cmd', 'uimode', 'night'])).trim(),
    cores: (await adb(['shell', 'nproc'])).trim(),
    // 宿主机上 qemu 进程的调度优先级（31 = 正常，4 = 后台限速）
    qemuPriority: Number((await run('ps', ['-o', 'pri=', '-p', (await emulatorPids())[0] ?? '0'], { allowFail: true })).trim()) || null,
  };
  log(`Android ${ANDROID.serial} booted in ${rebootMs} ms; env ${JSON.stringify(env)}`);
  return {
    serial: ANDROID.serial,
    rebootMs,
    env,
    emulatorArgs: args.slice(2),
    device: `${ANDROID.avd} emulator (android-36 default arm64-v8a; ${args.slice(2).join(' ')})`,
  };
}

async function androidLocale() {
  const p = (await adb(['shell', 'getprop', 'persist.sys.locale'])).trim();
  return p || (await adb(['shell', 'getprop', 'ro.product.locale'])).trim();
}

/** Android：卸载后安装（installMs 只计安装；Detox 另装测试 APK）。 */
export async function installAndroid(apks) {
  await adb(['uninstall', BUNDLE], { allowFail: true });
  await adb(['uninstall', `${BUNDLE}.test`], { allowFail: true });
  const t0 = Date.now();
  for (const apk of apks) await adb(['install', '-r', '-t', apk], { timeoutMs: 300_000 });
  const ms = Date.now() - t0;
  // app 经 localhost:4000 访问 mock server。冷启动后 adb reverse 消失；Detox 只在自己安装 app 时设置 reversePorts，
  // harness 让它 --reuse（不重装）→ 由 harness 统一设置（四个工具相同，Appium onPrepare 中的重复设置无害）
  await adb(['reverse', 'tcp:4000', 'tcp:4000']);
  return ms;
}

/** slow-cpu：在模拟器内运行一个占用 1 核的后台进程（METHODOLOGY 8.4）。 */
export async function startCpuHog() {
  await adb(['shell', 'nohup sh -c "while :; do :; done" >/dev/null 2>&1 &']);
}

export function exists(p) {
  return fs.existsSync(p);
}
