// C3 系统分享面板：打开后关闭
import type { Driver } from '@quiesco/core';
import { login, reset, test } from '../support';

test.beforeEach(reset);

async function openSystem(app: Driver) {
  await login(app);
  await app.tap('tab-settings');
  await app.tap('open-system');
}

test('C3 系统分享面板：打开后关闭', async ({ app }) => {
  await openSystem(app);
  await app.tap('share-button');
  if (app.platform === 'ios') {
    // 分享面板在 Quiesco 的系统 UI 读取中看不到（system.expectVisible 报 “outside the app: nothing”，实测）
    // iOS 27 的分享面板没有关闭按钮，点面板外的空白区域（窗口坐标）
    await app.tapAt({ x: 200, y: 390 });
  } else {
    await app.device.system.expectVisible({ text: 'Sharing text' });
    await app.pressBack();
  }
  await app.expectText('share-status', 'Share dismissed');
});
