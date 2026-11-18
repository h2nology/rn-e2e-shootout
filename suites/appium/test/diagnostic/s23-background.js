// S23 前后台切换与持久化：mobile: backgroundApp（2 秒后自动回到前台）、mobile: terminateApp、mobile: launchApp / activateApp
import { resetApp, login, byId, tap, sendToBackground, terminate, launch } from '../support.js';

describe('S23', () => {
  beforeEach(resetApp);
  it('草稿在前后台切换后保持，保存后重启仍在', async () => {
    await login();
    await tap('add-item-button');
    await byId('new-item-title').setValue('Draft text');
    await sendToBackground(2);
    await expect(byId('new-item-title')).toHaveText('Draft text');
    await byId('new-item-title').setValue('Persisted');
    await tap('new-item-save');
    await terminate();
    await launch();
    await expect(byId('list-top-title')).toHaveText('Top: Persisted');
  });
});
