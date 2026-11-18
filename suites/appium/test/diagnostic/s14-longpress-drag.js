// S14 长按菜单与拖拽排序（element.longPress / element.dragAndDrop）
import { resetApp, login, byId, tap } from '../support.js';

describe('S14', () => {
  beforeEach(resetApp);
  it('长按置顶，拖拽 R5 到 R1 的位置', async () => {
    await login();
    await byId('item-row-3').longPress();
    await tap('menu-pin');
    await expect(byId('list-top-title')).toHaveText('Top: Item 003');
    await tap('tab-explore');
    await tap('open-reorder');
    await byId('reorder-handle-R5').dragAndDrop(byId('reorder-row-R1'), { duration: 1000 });
    await expect(byId('reorder-summary')).toHaveText('R5,R1,R2,R3,R4,R6,R7,R8,R9,R10');
  });
});
