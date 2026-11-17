// mock server 提供的 HTML 页面

const head = `<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<style>body{font-family:-apple-system,system-ui,sans-serif;padding:24px;font-size:18px}
button,input{font-size:18px;padding:10px 16px;margin-top:12px}</style>`;

export const pages = {
  /** S9：WebView 内的按钮，点击后向原生侧发送 "hello" */
  webview: () => `<!doctype html><html><head>${head}<title>WebView</title></head><body>
<p id="ready">Web page ready</p>
<button id="send" type="button">Send to native</button>
<script>
document.getElementById('send').addEventListener('click', function () {
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage('hello');
  } else if (window.parent !== window) {
    window.parent.postMessage('hello', '*'); // Web 版（iframe）
  }
});
</script></body></html>`,

  /** C2：OAuth 式登录页。提交后重定向回 app */
  oauth: (redirectUri: string) => `<!doctype html><html><head>${head}<title>Sign in</title></head><body>
<h1>Mock OAuth</h1>
<form id="form">
  <label>Username <input id="username" name="username" autocomplete="off"></label><br>
  <button id="submit" type="submit">Continue</button>
</form>
<script>
document.getElementById('form').addEventListener('submit', function (e) {
  e.preventDefault();
  var u = document.getElementById('username').value;
  var target = ${JSON.stringify(redirectUri)};
  location.href = target + (target.indexOf('?') >= 0 ? '&' : '?') + 'user=' + encodeURIComponent(u);
});
</script></body></html>`,
};
