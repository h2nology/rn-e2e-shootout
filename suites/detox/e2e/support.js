// 共用辅助：状态重置（METHODOLOGY 5）与界面登录（scenarios.md 0.4）
const MOCK = 'http://localhost:4000';

async function resetServer() {
  await fetch(`${MOCK}/reset`, { method: 'POST' });
}

async function postJson(path, body) {
  await fetch(`${MOCK}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** 服务端 /reset + 清除 app 数据并冷启动。Detox 没有“只清数据”的 API，官方做法是 delete（卸载重装）。 */
async function resetApp(launchArgs = {}) {
  await resetServer();
  await device.launchApp({ delete: true, newInstance: true, ...launchArgs });
}

async function login() {
  await element(by.id('login-email')).typeText('user@example.com');
  await element(by.id('login-password')).typeText('Passw0rd!');
  await element(by.id('login-submit')).tap();
}

module.exports = { MOCK, resetServer, postJson, resetApp, login };
