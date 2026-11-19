// C2 跨 app 登录（iOS：ASWebAuthenticationSession；Android：Custom Tab，只在 GAPIS 镜像上检查）
import type { Driver } from '@quiesco/core';
import { login, test } from '../support';

async function openSystem(app: Driver) {
  await login(app);
  await app.tap('tab-settings');
  await app.tap('open-system');
}

test('C2 跨 app 登录', async ({ app }) => {
  await openSystem(app);
  await app.tap('oauth-login');
  if (app.platform === 'ios') await app.device.system.tap({ text: 'Continue' }); // “… Wants to Use … to Sign In” 确认框
  // 外部浏览器页面（mock server 的 OAuth 页）：<label>Username <input></label> + <button>Continue</button>
  await app.device.system.type({ text: 'Username' }, 'oauth-user');
  await app.device.system.tap({ text: 'Continue' });
  await app.expectText('oauth-status', 'Signed in as oauth-user');
});
