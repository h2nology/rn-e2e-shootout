// S11 永不静止的动画
const { resetApp, login } = require('../support');

describe('S11', () => {
  beforeEach(resetApp);
  it('在有无限动画的页面上点击按钮', async () => {
    await login();
    await element(by.id('tab-explore')).tap();
    // [X] 无限动画会让 Detox 的同步一直等待（诊断版 120 s 超时），按官方文档关闭同步。
    //     必须在进入该页面之前关闭：点击进入页面的那一步就会因动画开始而永不空闲。
    await device.disableSynchronization();
    await element(by.id('open-busy-animation')).tap();
    // [W3] 关闭同步后需自行等待元素出现
    await waitFor(element(by.id('busy-tap'))).toBeVisible().withTimeout(10000);
    await element(by.id('busy-tap')).tap();
    await waitFor(element(by.id('busy-result'))).toHaveText('Tapped 1').withTimeout(10000);
    // 不在此处 enableSynchronization()：它会等待 app 空闲，而该页面永不空闲（实测卡在这里）。
    // 下一个场景的 resetApp 会重新启动 app，同步随之恢复为默认开启。
  });
});
