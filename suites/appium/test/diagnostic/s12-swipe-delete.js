// S12 左滑删除（browser.swipe 在行元素内从右向左滑）
import { resetApp, login, byId, tap } from '../support.js';

describe('S12', () => {
  beforeEach(resetApp);
  it('左滑后点删除，条目消失', async () => {
    await login();
    await driver.swipe({ direction: 'left', scrollableElement: await byId('item-row-1'), percent: 0.6, duration: 300 });
    await tap('swipe-delete-1');
    await expect(byId('item-row-1')).not.toExist();
    await expect(byId('list-top-title')).toHaveText('Top: Item 002');
  });
});
