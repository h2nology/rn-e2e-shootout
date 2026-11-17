# rn-e2e-shootout

在同一个 Expo app、同一组场景、同一台机器上，对比四个 React Native E2E 测试工具：**Quiesco、Detox、Appium、Maestro**。

> **状态**：方法（`METHODOLOGY.md`）和场景（`scenarios.md`）已于 2026-11-17 预注册（tag `methodology-v1`）。还没有任何测量结果。

## 立场披露

本项目由 **Quiesco 的作者**发起，结果会用于 Quiesco 官网的对比页。我们知道这会带来偏差，因此：

- 在跑出任何数据之前，先把方法和场景定稿并打 tag（预注册），之后的修改都会开新版本并全部重跑。
- 预注册的所有指标都会发布，包括 Quiesco 不占优的指标。
- 四套测试实现、原始数据、日志全部公开。
- 邀请各工具的使用者 review 实现。如果你认为某个工具的实现不公平，欢迎提 issue 或 PR。

已知的 Quiesco 弱项：只支持 Expo SDK 55 及以上；需要 dev client（不支持 Expo Go）；需要在 app 中加入 `<QuiescoRoot>`；基于“等待静止”的同步机制在永不静止的动画、轮询和长连接面前可能吃亏（场景 S11、S15、S16 专门测这一点）。

## 对比什么

| 观点 | 内容 |
|---|---|
| 易用性 | AI 编写效率、首个测试通过所需时间、接入步骤、改动文件、代码量、等待数、报错可读性 |
| 速度 | 单场景 / 整套耗时（median、p90）、重置耗时、构建耗时 |
| 稳定性 | 正常条件与施压条件（慢网络、慢 CPU、动画时长抖动）下的失败率，附 95% Wilson 置信区间 |
| Expo 版本支持 | Expo SDK 54–58 × 四个工具 |
| 补充 | 跨平台复用率、失败诊断、CI 成本、运行器生态、对 app 的侵入、能力边界、成熟度 |

详细定义见 [`METHODOLOGY.md`](METHODOLOGY.md)，场景见 [`scenarios.md`](scenarios.md)。

## 版本

| 工具 | 版本 |
|---|---|
| Quiesco | 0.5.0（Vitest） |
| Detox | 20.51.4（Jest） |
| Appium | 4.0.0（WebdriverIO 10.2.0） |
| Maestro | 2.11.0 |
| Expo SDK | 58 |

## 目录

```
app/            被测 Expo app
mock-server/    可调延迟 / 可注入错误的 API 服务
suites/         四套测试实现（quiesco / detox / appium / maestro）
harness/        统一执行器与结果收集
results/        原始数据（raw/）、汇总（summary.json）、图表（charts/）
expo-matrix/    Expo SDK 版本矩阵
```

项目的执行计划与进度也一并公开：[`e2e-comparison-plan.md`](e2e-comparison-plan.md)（计划书）、[`task_plan.md`](task_plan.md)、[`findings.md`](findings.md)、[`progress.md`](progress.md)。

## 如何复现

（M2–M4 完成后补充。）

## 结果

（尚无。）

## 许可证

[MIT](LICENSE)
