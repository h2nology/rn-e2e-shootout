// harness 的计时标记（METHODOLOGY 7）：场景开始（重置开始）、重置结束、场景结束各发一次到 mock server。
// 参数 EVENT；场景名取 Maestro 内置的 MAESTRO_FILENAME（flow 文件名）。只用于计时，失败时忽略。
try {
  http.post('http://localhost:4000/harness/mark', {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: EVENT, scenario: typeof MAESTRO_FILENAME === 'undefined' ? '' : MAESTRO_FILENAME }),
  })
} catch (e) {
  // 计时标记失败不影响测试
}
