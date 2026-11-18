// S4 新增条目并在刷新后保留
import { resetApp, login, byId, tap, typeText } from '../support.js';

describe('S4', () => {
  beforeEach(resetApp);
  it('新增条目出现在顶部，刷新后仍在', async () => {
    await login();
    await tap('add-item-button');
    await typeText(byId('new-item-title'), 'New task');
    await tap('new-item-save');
    await expect(byId('list-top-title')).toHaveText('Top: New task');
    await tap('list-reload');
    await expect(byId('list-top-title')).toHaveText('Top: New task');
  });
});
