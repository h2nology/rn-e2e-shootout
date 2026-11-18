// S16 轮询与 WebSocket
import { resetApp, login, byId, tap } from '../support.js';

describe('S16', () => {
  beforeEach(resetApp);
  it('在有轮询和 WebSocket 的页面上提交表单', async () => {
    await login();
    await tap('tab-explore');
    await tap('open-live');
    await byId('live-name').setValue('Alice');
    await tap('live-submit');
    await expect(byId('live-greeting')).toHaveText('Hello, Alice');
  });
});
