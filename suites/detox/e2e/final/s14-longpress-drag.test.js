// S14 长按菜单与拖拽排序
const { resetApp, login } = require('../support');

describe('S14', () => {
  beforeEach(resetApp);
  it('长按置顶，拖拽 R5 到 R1 的位置', async () => {
    await login();
    await element(by.id('item-row-3')).longPress();
    await element(by.id('menu-pin')).tap();
    await expect(element(by.id('list-top-title'))).toHaveText('Top: Item 003');

    await element(by.id('tab-explore')).tap();
    await element(by.id('open-reorder')).tap();
    await element(by.id('reorder-handle-R5')).longPressAndDrag(
      150, 0.5, 0.5, element(by.id('reorder-row-R1')), 0.5, 0.2, 'slow', 0,
    );
    await expect(element(by.id('reorder-summary'))).toHaveText('R5,R1,R2,R3,R4,R6,R7,R8,R9,R10');
  });
});
