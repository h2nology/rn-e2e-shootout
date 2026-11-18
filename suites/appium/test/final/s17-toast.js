// S17 自动消失的 Toast
import { resetApp, login, byId, tap } from '../support.js';

describe('S17', () => {
  beforeEach(resetApp);
  it('Toast 出现后消失', async () => {
    await login();
    await tap('tab-settings');
    await tap('settings-save');
    await expect(byId('toast')).toHaveText('Saved');
    await expect(byId('toast')).not.toExist();
  });
});
