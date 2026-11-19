// S9 WebView
import { login, reset, test } from '../support';

test.beforeEach(reset);

test('S9 WebView', async ({ app }) => {
  await login(app);
  await app.tap('tab-explore');
  await app.tap('open-webview');
  const page = app.webview();
  await page.element({ text: 'Web page ready' }).expectVisible();
  await page.element({ css: '#send' }).tap();
  await app.expectText('webview-result', 'Received: hello');
});
