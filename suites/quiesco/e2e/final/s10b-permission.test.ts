// S10b 点击系统弹窗“允许”
import { login, test } from '../support';

test('S10b 点击系统弹窗“允许”', async ({ app }) => {
  await login(app);
  await app.tap('tab-settings');
  await app.tap('open-permission');
  // [X] 这次点击会打开系统权限弹窗。Android 上 app 随即进入后台，JS 定时器暂停；Quiesco 动作之后的空闲等待只在 AppState 变化的
  //     那一刻检查一次，若此时还有 tracker 忙，就睡在暂停的定时器上不再醒来，15 s 后 AGENT_TIMEOUT（Android 正式版 5 轮中 1 次，
  //     读 agent 源码确认，见 findings.md）→ 这次点击不做动作后的同步。下一步 system.tap 会等弹窗出现，expectText 在回到前台后再同步
  await app.tap('request-location', { sync: false });
  if (app.platform === 'ios') await app.device.system.tap({ text: 'Allow While Using App' });
  else await app.device.system.tap({ id: 'permission_allow_foreground_only_button' });
  await app.expectText('permission-status', 'Granted');
});
