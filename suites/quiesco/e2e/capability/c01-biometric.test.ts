// C1 生物识别：失败一次（取消）再成功
import { login, test } from '../support';

test('C1 生物识别：失败一次（取消）再成功', async ({ app }) => {
  // Quiesco 内置：iOS notifyutil；Android 设置锁屏 PIN 并经设置 app 登记指纹（测试结束后撤销）
  await app.device.biometrics.enroll();
  await login(app);
  await app.tap('tab-settings');
  await app.tap('open-biometric');
  await app.tap('biometric-unlock');
  await app.device.biometrics.fail();
  // 失败后系统保持重试提示，点“取消”结束验证（scenarios.md C1）
  if (app.platform === 'ios') await app.device.system.tap({ text: 'Cancel' });
  else await app.device.system.tap({ id: 'button_negative' });
  await app.expectText('biometric-status', 'Failed');
  await app.tap('biometric-unlock');
  await app.device.biometrics.match();
  await app.expectText('biometric-status', 'Unlocked');
});
