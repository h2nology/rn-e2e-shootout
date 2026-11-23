// harness 的计时标记（METHODOLOGY 7）：场景开始（重置开始）、重置结束、场景结束各发一次到 mock server。
// 只用于计时，不影响测试；mock server 不可用时忽略。
// mocha 的 root hook（wdio.conf.js 的 mochaOpts.require）先于各文件 describe 内的 beforeEach（resetApp）执行。
const MOCK = 'http://localhost:4000';
let current = '';

export async function harnessMark(event, scenario = current) {
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

export const mochaHooks = {
  async beforeEach() {
    current = this.currentTest?.fullTitle() ?? '';
    await harnessMark('scenario-start');
  },
  async afterEach() {
    await harnessMark('scenario-end');
  },
};
