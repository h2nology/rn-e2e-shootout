# Detox：等待与同步绕过清单（正式版）

按 METHODOLOGY 4 分类。诊断版（`e2e/diagnostic`）不含以下任何一项。

| # | 文件 | 类别 | 内容 | 为什么需要 |
|---|---|---|---|---|
| 1 | `e2e/final/s11-busy.test.js` | X | 进入页面前 `device.disableSynchronization()`，之后不再 `enableSynchronization()` | 无限动画使 Detox 同步永不空闲（诊断版 120 s 超时）；在页面内重新开启同步会因等待空闲而卡死（实测），依赖下一个场景重启 app 恢复同步 |
| 2 | `e2e/final/s11-busy.test.js` | W3 | `waitFor(busy-tap).toBeVisible().withTimeout(10000)` | 关闭同步后需要自行等待 |
| 3 | `e2e/final/s11-busy.test.js` | W3 | `waitFor(busy-result).toHaveText('Tapped 1').withTimeout(10000)` | 同上 |
| 4 | `e2e/final/s17-toast.test.js` | W3 | `waitFor(toast).not.toExist().withTimeout(5000)` | Toast 的 2 秒定时器超过 Detox 的定时器跟踪阈值，同步不会等待它消失 |
| 5 | `e2e/final/s21-deeplink.test.js` | W3 | `waitFor(item-detail-title).toHaveText('Item 123').withTimeout(10000)` | 外部命令（simctl / adb）触发的前台切换 Detox 感知不到，诊断时偶发失败 |
| 6 | `e2e/jest.config.js` | W3 | 单测超时 120 s → 300 s | S6 滚动到第 400 行在 Detox 下约需 120 s（每步滚动都等待 app 空闲） |
| 7 | `e2e/final/s03-search.test.js` | W3 | `waitFor(search-count).toHaveText('10 results').withTimeout(5000)` | Android 上 Detox 不等待 300 ms 防抖定时器与随后的请求（iOS 会等） |
| 8 | `e2e/final/s15-reanimated.test.js` | W3 | `waitFor(rea-card-action).toBeVisible().withTimeout(5000)` | Android 上 Detox 不等待 Reanimated（UI 线程）动画（iOS 会等） |
| 9 | `e2e/final/s20-keyboard.test.js` | W1 | Android 上 `setTimeout(1000)` | 键盘收起后 KeyboardAvoidingView 仍在调整布局，Detox（Android）不等待，点击落空；没有可等待的元素状态 |

## 汇总（正式版）

按调用点计数（METHODOLOGY 4.2）。#7、#8 两个平台都执行，但只为 Android 而加；#9 只在 Android 执行。

| 平台 | W1 固定 sleep | W2 手写重试 | W3 条件等待 | X 同步绕过 |
|---|---|---|---|---|
| iOS 需要 | 0 | 0 | 5（#2–#6） | 1 |
| Android 需要 | 1（#9） | 0 | 7（#2–#8） | 1 |
| 套件合计（代码中的调用点） | 1 | 0 | 7 | 1 |

## 不计入的项

- S6 的 `waitFor(...).toBeVisible().whileElement(...).scroll(400, 'down')`：Detox 官方的“边滚动边查找”API，属于滚动操作，不是等待。诊断版同样使用。
- S8 Android 的日期选择：以 OK 按钮为基准按坐标点击“25”（Detox 无 Android 日期 API，日期格子不是独立 View）。属于操作方式的变通，不是等待，但坐标依赖设备，较脆弱。
