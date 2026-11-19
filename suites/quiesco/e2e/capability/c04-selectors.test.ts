// C4 选择器：同 testID 的第 3 个；只用 accessibility label
import { login, test } from '../support';

test('C4 选择器：同 testID 的第 3 个；只用 accessibility label', async ({ app }) => {
  await login(app);
  await app.tap('tab-explore');
  await app.tap('open-dup');
  await app.tap({ id: 'dup-row', index: 2 });
  await app.expectText('dup-result', 'Row 3');
  await app.tap({ label: 'Secret button' });
  await app.expectText('a11y-result', 'Found');
});
