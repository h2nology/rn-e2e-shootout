// C2 跨 app 登录
import type { Driver } from '@quiesco/core';
import { execFileSync } from 'node:child_process';
import { login, reset, test } from '../support';

test.beforeEach(reset);

async function openSystem(app: Driver) {
  await login(app);
  await app.tap('tab-settings');
  await app.tap('open-system');
}

test('C2 跨 app 登录', async ({ app }) => {
  await openSystem(app);
  await app.tap('oauth-login');
  if (app.platform === 'ios') await app.device.system.tap({ text: 'Continue' }); // ASWebAuthenticationSession 的确认框
  // 外部浏览器页面（mock server 的 OAuth 页）：<label>Username <input></label> + <button>Continue</button>
  // iOS：页面在 ASWebAuthenticationSession（其他进程）中，system.* 读不到页面元素（“outside the app: nothing”，实测）→ ✗
  // Android：Custom Tab 的页面元素可经 system.tap 点击，但 system.* 没有输入文字的 API → 外部命令 adb shell input text
  await app.device.system.tap({ text: 'Username' });
  execFileSync('adb', ['shell', 'input', 'text', 'oauth-user']);
  await app.device.system.tap({ text: 'Continue' });
  await app.expectText('oauth-status', 'Signed in as oauth-user');
});
