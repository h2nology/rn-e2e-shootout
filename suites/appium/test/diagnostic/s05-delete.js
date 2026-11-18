// S5 删除条目，确认 Modal
import { resetApp, login, byId, tap } from '../support.js';

describe('S5', () => {
  beforeEach(resetApp);
  it('确认 Modal 出现，确认后条目消失', async () => {
    await login();
    await tap('item-delete-2');
    await expect(byId('confirm-modal')).toBeDisplayed();
    await tap('confirm-ok');
    await expect(byId('confirm-modal')).not.toExist();
    await expect(byId('item-row-2')).not.toExist();
    await expect(byId('item-row-1')).toExist();
    await expect(byId('item-row-3')).toExist();
  });
});
