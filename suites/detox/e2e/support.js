// 共用辅助：状态重置（METHODOLOGY 5）与界面登录（scenarios.md 0.4）
const { execSync } = require('child_process');
const BUNDLE = 'com.rnshootout.app';
const MOCK = 'http://localhost:4000';
const { harnessMark } = require('./harness-mark');

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

/**
 * 服务端 /reset + 清除 app 数据并冷启动（METHODOLOGY 5：不重新安装）。
 * Detox 没有“只清数据”的 API（官方做法 launchApp({ delete: true }) 是卸载重装，与规则不一致），
 * 因此用外部命令补齐：
 *   iOS：结束 app → 清空数据容器（Library / Documents / tmp）→ simctl privacy reset 重置权限
 *   Android：pm clear（清数据，同时撤销运行时权限）
 */
async function resetApp(launchArgs = {}) {
  await resetServer();
  await device.terminateApp();
  if (device.getPlatform() === 'ios') {
    const data = execSync(`xcrun simctl get_app_container ${device.id} ${BUNDLE} data`).toString().trim();
    if (!data.includes('/Containers/Data/Application/')) throw new Error(`unexpected container: ${data}`);
    execSync(`rm -rf "${data}"/Library/* "${data}"/Documents/* "${data}"/tmp/*`, { shell: '/bin/sh' });
    execSync(`xcrun simctl privacy ${device.id} reset all ${BUNDLE}`);
  } else {
    execSync(`adb -s ${device.id} shell pm clear ${BUNDLE}`);
  }
  await device.launchApp({ newInstance: true, ...launchArgs });
  // 场景中第一次重置的结束时刻（harness 只取每个场景的第一次）
  await harnessMark('reset-end');
}

async function login() {
  await element(by.id('login-email')).typeText('user@example.com');
  await element(by.id('login-password')).typeText('Passw0rd!');
  await element(by.id('login-submit')).tap();
}

module.exports = { MOCK, resetServer, postJson, resetApp, login };
