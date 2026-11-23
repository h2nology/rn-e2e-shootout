// harness 的计时标记（METHODOLOGY 7）：场景开始（重置开始）、重置结束、场景结束各发一次到 mock server。
// 只用于计时，不影响测试；mock server 不可用时忽略。
const MOCK = 'http://localhost:4000';

// Detox 把全局 expect 换成自己的 expect（没有 getState），当前测试名从 Jest 的 matchers 全局状态读
function currentTestName() {
  return globalThis[Symbol.for('$$jest-matchers-object')]?.state?.currentTestName ?? '';
}

async function harnessMark(event) {
  const scenario = currentTestName();
  try {
    await fetch(`${MOCK}/harness/mark`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ event, scenario }),
      signal: AbortSignal.timeout(2000),
    });
  } catch {
    // 计时标记失败不影响测试
  }
}

module.exports = { harnessMark };
