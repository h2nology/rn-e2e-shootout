// 共用辅助：选择器、状态重置（METHODOLOGY 5）、界面登录（scenarios.md 0.4）、平台差异的小封装
export const BUNDLE = 'com.rnshootout.app';
export const MOCK = 'http://localhost:4000';

export const isIOS = () => driver.isIOS;
/** mobile: 命令里 app 的标识参数：iOS 用 bundleId，Android 用 appId */
export const app = () => (isIOS() ? { bundleId: BUNDLE } : { appId: BUNDLE });

/**
 * 按 testID 定位（scenarios.md 0.6）。
 * iOS：RN 把 testID 映射为 accessibilityIdentifier → accessibility id（`~`）。
 * Android：RN 把 testID 映射为 resource-id（不带包名前缀），`~` 指 content-desc，因此用 UiSelector。
 */
export function sel(id) {
  return isIOS() ? `~${id}` : `android=new UiSelector().resourceId("${id}")`;
}
export const byId = (id) => $(sel(id));

/** 按可见文字定位（testID 之外的系统 UI、WebView 内容等） */
export function byText(text) {
  return isIOS()
    ? $(`-ios predicate string:label == "${text}"`)
    : $(`android=new UiSelector().text("${text}")`);
}

export async function resetServer() {
  await fetch(`${MOCK}/reset`, { method: 'POST' });
}

export async function postJson(p, body) {
  await fetch(`${MOCK}${p}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/**
 * 服务端 /reset + 清除 app 数据并冷启动（不重新安装）。全部用 Appium 的 API：
 * iOS：mobile: clearApp（仅模拟器；结束 app 并清空数据容器）→ mobile: simctl privacy reset all（撤销权限）→ mobile: launchApp
 *   （mobile: setPermission 走 applesimutils，耗时约 10 s 且会使 WebDriverAgent 断开，实测不可用）
 * Android：mobile: clearApp（pm clear，同时结束进程、撤销运行时权限）→ mobile: activateApp
 */
export async function resetApp() {
  await resetServer();
  if (isIOS()) {
    await driver.execute('mobile: clearApp', { bundleId: BUNDLE });
    await driver.execute('mobile: simctl', { command: 'privacy', args: ['reset', 'all', BUNDLE] });
    await driver.execute('mobile: launchApp', { bundleId: BUNDLE });
  } else {
    await driver.execute('mobile: clearApp', { appId: BUNDLE });
    await driver.execute('mobile: activateApp', { appId: BUNDLE });
  }
}

const FINAL = (process.env.VARIANT ?? 'final') === 'final';

/**
 * 文本输入。诊断版：直接 setValue。
 * 正式版（iOS）：[W3] 先输入第一个字符，等输入框的值反映出来，再输入其余部分。
 *   XCUITest 不等待 app：RN 受控 TextInput 对第一次按键的 setState 往返较慢，期间的后续按键会被
 *   写回的旧值覆盖（诊断版实测丢 1–3 个字符，如 `ur@example.com`；maxTypingFrequency 20 冷启动下仍 4/8 失败，
 *   本写法冷启动 24/24 正确）。Android 的 setValue 由 UiAutomator2 一次写入整段文字，不受影响。
 */
export async function typeText(el, text) {
  if (!FINAL || !isIOS()) return el.setValue(text);
  await el.setValue(text[0]); // setValue 先清空，所以值应恰好为 1 个字符（密码框显示为 •）
  await driver.waitUntil(async () => (await el.getText()).length === 1);
  await el.addValue(text.slice(1));
}

export async function login() {
  await typeText(byId('login-email'), 'user@example.com');
  await typeText(byId('login-password'), 'Passw0rd!');
  await byId('login-submit').click();
}

export async function tap(id) {
  await byId(id).click();
}

/** S19 的“返回”：Android 硬件返回键；iOS 点导航栏左上角的返回按钮 */
export async function goBack() {
  if (isIOS()) {
    await $('-ios predicate string:type == "XCUIElementTypeButton" AND label == "Back"').click();
  } else {
    await driver.back();
  }
}

/** 把 app 切到后台并停留（-1 = 不自动回来） */
export async function sendToBackground(seconds = -1) {
  await driver.execute('mobile: backgroundApp', { seconds });
}

export async function terminate() {
  await driver.execute('mobile: terminateApp', app());
}

export async function launch() {
  await driver.execute(isIOS() ? 'mobile: launchApp' : 'mobile: activateApp', app());
}
