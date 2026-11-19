// 共用辅助：状态重置（METHODOLOGY 5）、界面登录（scenarios.md 0.4）、调用 mock server（scenarios.md 0.5）。
import { execFileSync } from 'node:child_process';
import { test as base } from '@quiesco/vitest';
import type { Driver } from '@quiesco/core';

export const MOCK = 'http://localhost:4000';

export async function postJson(path: string, body?: unknown): Promise<void> {
  const res = await fetch(`${MOCK}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path}: ${res.status}`);
}

/**
 * 服务端 /reset + 清除 app 数据并冷启动（不重新安装）。
 * Quiesco 默认在每个测试前做 soft reset（app 内清 AsyncStorage、重置导航并重新挂载），粒度与 METHODOLOGY 5
 * 不同 → 另外用官方 API relaunch({ clearData: true })（iOS：清空数据容器、删除 UserDefaults；Android：pm clear）。
 * iOS 的 clearData 不撤销权限 → 定位权限另外 reset（simctl privacy reset；S10b 需要系统弹窗再次出现）。
 */
export async function resetApp(app: Driver): Promise<void> {
  await postJson('/reset');
  if (app.platform === 'ios') await app.device.setPermission('location', 'reset');
  await app.device.relaunch({ clearData: true });
}

export async function login(app: Driver): Promise<void> {
  await app.type('login-email', 'user@example.com');
  await app.type('login-password', 'Passw0rd!');
  await app.tap('login-submit');
}

export const test = base;

/**
 * 各测试文件写 `test.beforeEach(reset)`。quiesco() 设置 isolate: false（模块在文件之间共享），
 * 在本模块顶层注册的 hook 只对第一个文件生效，所以由每个文件自己注册。
 */
export const reset = async ({ app }: { app: Driver }) => resetApp(app);

/**
 * S21 热启动：app 在后台时打开深链接。Quiesco 的 openUrl() 要求 app 在前台（在后台时报错并提示先 bringToForeground），
 * 场景允许外部命令 → iOS `simctl openurl`、Android `am start`。之后 bringToForeground() 让 Quiesco 知道 app 已回到前台
 * （同一进程，不重启）。
 */
export async function openUrlFromOutside(app: Driver, url: string): Promise<void> {
  if (app.platform === 'ios') {
    execFileSync('xcrun', ['simctl', 'openurl', 'booted', url]);
    // iOS 27：从外部打开自定义 scheme 时可能弹出确认框（点过一次后该模拟器不再出现），出现时才点
    await app.device.system.tap({ text: 'Open' }, { timeoutMs: 3000 }).catch(() => {});
  } else {
    execFileSync('adb', ['shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', url, 'com.rnshootout.app']);
  }
  await app.device.bringToForeground();
}

/**
 * S8 Android：系统日期对话框是 app 进程的独立窗口。Quiesco 在 app 内注入的触摸到不了它，system.tap 只看其他 package 的 UI，
 * 官方做法是 setValue（调用回调，S8 的通过标准禁止）→ 外部命令：uiautomator dump 找到文字所在的节点，adb shell input tap 点击。
 */
export function tapAndroidDialogText(text: string): void {
  const xml = execFileSync('adb', ['exec-out', 'uiautomator', 'dump', '/dev/tty']).toString();
  for (const node of xml.match(/<node [^>]*>/g) ?? []) {
    if (!node.includes(`text="${text}"`)) continue;
    const [x1, y1, x2, y2] = node.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/)!.slice(1).map(Number);
    execFileSync('adb', ['shell', 'input', 'tap', String((x1 + x2) >> 1), String((y1 + y2) >> 1)]);
    return;
  }
  throw new Error(`no node with text "${text}" on screen`);
}
