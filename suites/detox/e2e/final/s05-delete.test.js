// S5 删除条目，确认 Modal
const { resetApp, login } = require('../support');

describe('S5', () => {
  beforeEach(resetApp);
  it('确认 Modal 出现，确认后条目消失', async () => {
    await login();
    await element(by.id('item-delete-2')).tap();
    await expect(element(by.id('confirm-modal'))).toBeVisible();
    await element(by.id('confirm-ok')).tap();
    await expect(element(by.id('confirm-modal'))).not.toExist();
    await expect(element(by.id('item-row-2'))).not.toExist();
    await expect(element(by.id('item-row-1'))).toExist();
    await expect(element(by.id('item-row-3'))).toExist();
  });
});
