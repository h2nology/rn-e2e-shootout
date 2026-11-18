// 测试中调用 mock server（scenarios.md 0.5）。参数：PATH、BODY（JSON 字符串）
var r = http.post('http://localhost:4000' + PATH, {
  headers: { 'Content-Type': 'application/json' },
  body: BODY,
})
if (r.status !== 200) throw new Error('POST ' + PATH + ' failed: ' + r.status)
