// S12 左滑删除（browser.swipe 在行元素内从右向左滑）
import { resetApp, login, byId, tap } from '../support.js';

describe('S12', () => {
  beforeEach(resetApp);
  it('左滑后点删除，条目消失', async () => {
    await login();
    // [W3] $() 本身不等待：登录后列表尚未渲染时取到的是不存在的元素（iOS 实测 Malformed elementId）
    const row = await byId('item-row-1');
    await row.waitForDisplayed();
    await driver.swipe({ direction: 'left', scrollableElement: row, percent: 0.6, duration: 300 });
    await tap('swipe-delete-1');
    await expect(byId('item-row-1')).not.toExist();
    await expect(byId('list-top-title')).toHaveText('Top: Item 002');
  });
});
