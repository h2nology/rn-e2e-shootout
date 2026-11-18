// Maestro 的 flow 不能执行 shell 命令（runScript 是沙箱内的 JS，只能发 HTTP）。
// Maestro 自带命令做不到、但场景允许使用外部命令的操作，由这个本地 HTTP 小服务代为执行，
// flow 里用 runScript + http.post 调用（见 flows/common/*.js）。计入易用性数据（额外配置）。
//
//   POST /ios/clear-data   iOS 状态重置：结束 app → 清空数据容器 → 撤销全部权限（METHODOLOGY 5）。
//                          Maestro 的 clearState 在 iOS 上会重装 app（官方文档），不符合“不重新安装”。
//   POST /sleep?ms=<n>     等待 n 毫秒后返回。Maestro 没有固定时长的等待命令，场景本身要求的停留（S23 后台 2 秒）用它实现
//   POST /exec?name=<key>  执行下面 COMMANDS 中预先登记的命令（不接受任意命令）
//
// 用法：node scripts/device-helper.mjs   （由 run.sh 启动；端口 4100）
import http from 'node:http';
import { execSync } from 'node:child_process';

const PORT = Number(process.env.HELPER_PORT ?? 4100);
const BUNDLE = 'com.rnshootout.app';
const IOS = process.env.IOS_UDID ?? 'booted';
const ADB = `adb -s ${process.env.ANDROID_SERIAL ?? 'emulator-5554'}`;
const PUSH_IOS = new URL('../../../mock-server/scripts/push-ios.sh', import.meta.url).pathname;
const notify = (name) => `xcrun simctl spawn ${IOS} notifyutil -p com.apple.BiometricKit_Sim.${name}`;
const sh = (cmd) => execSync(cmd, { shell: '/bin/sh', stdio: ['ignore', 'pipe', 'pipe'] }).toString();

function iosClearData() {
  try {
    sh(`xcrun simctl terminate ${IOS} ${BUNDLE}`);
  } catch {
    // app 未运行
  }
  const data = sh(`xcrun simctl get_app_container ${IOS} ${BUNDLE} data`).trim();
  if (!data.includes('/Containers/Data/Application/')) throw new Error(`unexpected container: ${data}`);
  sh(`rm -rf "${data}"/Library/* "${data}"/Documents/* "${data}"/tmp/*`);
  sh(`xcrun simctl privacy ${IOS} reset all ${BUNDLE}`);
}

/** 能力检查（C1–C11）等用到的外部命令，只允许这里列出的 */
const COMMANDS = {
  // C1 iOS：登记 Face ID、模拟匹配成功 / 失败（模拟器菜单 Features > Face ID 的等价命令）
  'ios-biometric-enroll': `xcrun simctl spawn ${IOS} notifyutil -s com.apple.BiometricKit.enrollmentChanged 1 && xcrun simctl spawn ${IOS} notifyutil -p com.apple.BiometricKit.enrollmentChanged`,
  'ios-biometric-match': notify('pearl.match'),
  'ios-biometric-nomatch': notify('pearl.nomatch'),
  // C1 Android：模拟指纹（前提：已设置 PIN 并登记指纹 id 1）
  'android-finger-1': `${ADB} emu finger touch 1`,
  'android-finger-2': `${ADB} emu finger touch 2`,
  // S7b iOS：登记拼音、日文罗马字键盘 / 恢复英文键盘（模拟器默认只有英文键盘）
  'ios-keyboards-cjk': `xcrun simctl spawn ${IOS} defaults write -g AppleKeyboards -array "zh_Hans-Pinyin@sw=Pinyin10-QWERTY;hw=Automatic" "ja_JP-Romaji@sw=QWERTY-Japanese;hw=Automatic"`,
  'ios-keyboards-en': `xcrun simctl spawn ${IOS} defaults write -g AppleKeyboards -array "en_US@sw=QWERTY;hw=Automatic"`,
  // C11 iOS：场景规定的 mock server 辅助脚本（simctl push）
  'ios-push': `sh ${PUSH_IOS} ${IOS}`,
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const t0 = Date.now();
  try {
    if (req.method !== 'POST') throw new Error('POST only');
    if (url.pathname === '/ios/clear-data') iosClearData();
    else if (url.pathname === '/sleep') await new Promise((r) => setTimeout(r, Number(url.searchParams.get('ms'))));
    else if (url.pathname === '/exec') {
      const cmd = COMMANDS[url.searchParams.get('name')];
      if (!cmd) throw new Error(`unknown command ${url.searchParams.get('name')}`);
      sh(cmd);
    } else throw new Error(`unknown path ${url.pathname}`);
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, ms: Date.now() - t0 }));
  } catch (e) {
    res.writeHead(500, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: String(e.stderr ?? e.message ?? e) }));
  }
});
server.listen(PORT, '127.0.0.1', () => console.log(`device-helper listening on ${PORT}`));
