// C3 系统分享面板：打开后关闭
import type { Driver } from '@quiesco/core';
import { login, test } from '../support';

async function openSystem(app: Driver) {
  await login(app);
  await app.tap('tab-settings');
  await app.tap('open-system');
}

test('C3 系统分享面板：打开后关闭', async ({ app }) => {
  await openSystem(app);
  await app.tap('share-button');
  if (app.platform === 'ios') {
    // 确认面板出现（面板的 “Copy” 项），再点面板上方的空白处关闭（iOS 27 的分享面板没有关闭按钮；
    // 屏幕上部（导航栏附近）点了不会关闭，与 Maestro 的实测相同 → 点屏幕高度约 45% 处）
    await app.device.system.expectVisible({ text: 'Copy' });
    await app.device.system.tapAt({ x: 200, y: 390 });
  } else {
    await app.device.system.expectVisible({ text: 'Sharing text' });
    await app.pressBack();
  }
  await app.expectText('share-status', 'Share dismissed');
});
