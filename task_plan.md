# Task Plan: rn-e2e-shootout（Quiesco / Detox / Appium / Maestro 对比）

规范文档：`e2e-comparison-plan.md`（以下简称“计划书”）。本文件只跟踪执行进度，内容以计划书为准。

## Goal

按计划书完成 M1–M10，产出公开仓库、原始数据、`results/summary.json`、官网对比页素材和发布文。

## Next Step

M3：先补验 M2 未走查的交互，然后按 Detox → Appium → Maestro → Quiesco 的顺序逐个从零接入。

## Current Phase

Phase 3（M3）

## Phases

### Phase 1: M1 仓库骨架与预注册文档

- [x] `git init`，建立计划书第 1 节的目录骨架
- [x] README.md（目的、立场披露、复现方法占位、结果摘要占位）
- [x] scenarios.md（S1–S23 + C1–C11，含前置条件 / 步骤 / 验证点 / 通过标准、平台适用性表）
- [x] METHODOLOGY.md（指标定义、等待分类 W1–W3、重置规则、N、预热、交错执行、Wilson 区间、施压条件、版本记录）
- [x] 用户审阅并确认 → 提交并打 tag `methodology-v1`
- **Status:** complete

### Phase 2: M2 被测 app + mock server

- [x] `create-expo-app`（SDK 58），Expo Router + New Architecture，scheme `rnshootout`
- [x] 实现 A1–A28，所有元素带稳定 `testID`（A24 的刻意例外除外）
- [x] mock-server：`/reset`、CRUD、延迟、错误注入、轮询 + WebSocket、OAuth 页、延迟图片、推送辅助脚本
- [x] 动画时长可配置（jitter），Toast 固定 2 秒
- [x] iOS 模拟器、Android 模拟器、Web 三端手动走通（Release 构建；未走查项见 progress.md，M3 首次实现时验证）
- **Status:** complete

### Phase 3: M3 四套测试实现（诊断版 + 正式版）

- [ ] 先补验 M2 未走查的交互：S14 拖拽、S7 IME、S8 滑块 / 原生日期、S22 通知、S23 前后台、C1 生物识别、C2 OAuth、C3 分享、C8 / C9 / C11

- [ ] detox（Jest），记录易用性数据；SDK 58 不在 Detox 官方支持范围内，按社区 `expo-detox-config-plugin`（≥13.1.0）+ Android ProGuard keep 规则接入，额外配置计入易用性；跑不通记 ✗ 并附来源
- [ ] appium（WebdriverIO），记录易用性数据
- [ ] maestro（YAML），记录易用性数据
- [ ] quiesco（0.5.0 + Vitest），记录易用性数据（最后接入）
- [ ] 每套正式版 iOS / Android 连续 5 次全绿，或记录 ✗ 原因；C1–C11 逐项检查
- **Status:** in_progress

### Phase 4: M4 harness 与汇总脚本

- [ ] `harness run --tool --platform --runs --variant --stress`
- [ ] 每次运行输出计划书第 5 节格式的 JSON
- [ ] 预热、交错执行（固定种子）、caffeinate
- [ ] 汇总：median / p90 / min / max、Wilson 95% 区间（整套 + 按场景）、图表
- **Status:** pending

### Phase 5: M5 本地正式测量

- [ ] 速度：N ≥ 20 × 工具 × 平台
- [ ] 稳定性：N = 100，诊断版 + 正式版
- [ ] 施压：slow-net / slow-cpu / jitter
- **Status:** pending

### Phase 6: M6 Expo 版本矩阵

- [ ] SDK 54–58（以执行时最新版为准向前 4–5 个）× 四工具，跑 S1
- [ ] 标注 Expo Go / dev client / prebuild / EAS Build / New Architecture
- **Status:** pending

### Phase 7: M7 AI 编写效率

- [ ] 固定模型、提示词；每工具 3 次，记录轮数与通过数，公开对话记录
- **Status:** pending

### Phase 8: M8 外部 review

- [ ] 请各工具使用者 review 实现；如有不公平之处，修正并重跑受影响测量
- **Status:** pending

### Phase 9: M9 CI 与定期重跑

- [ ] GitHub Actions 矩阵、月度定时、手动触发、artifact、summary 自动 PR、Renovate
- **Status:** pending

### Phase 10: M10 官网页面与发布文

- [ ] 标题数字、对比表、图表、方法 / 版本 / 硬件 / 立场披露、Quiesco 不占优项
- [ ] 博客 / 发布文
- **Status:** pending

## Key Questions

1. 外部 review（M8）找谁？——需用户提供人选。
2. “首个测试通过所需时间”由谁执行？——需用户确定第三方，否则按计划书披露为作者本人。
3. AI 编写效率使用哪个 LLM 模型 / 版本？——M7 开始前确定。
4. 仓库公开到哪里（GitHub 组织 / 账号）？——M9 前确定。

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Quiesco 版本锁定 0.5.0 | 用户指定；测量期间不升级 |
| Quiesco runner 用 Vitest（`@quiesco/vitest`） | 用户指定 |
| 深链接 scheme 为 `rnshootout` | 用户指定 |
| 被测 app 使用 Expo SDK 58.0.25 | 2026-11-17 npm 上的 latest |
| 只测 SDK 58，不加 SDK 55 对照组（暂定，“先只测”） | 用户决定（2026-11-17）。Detox 官方只支持 RN 0.77–0.84（SDK 58 为 RN 0.88），发布结果时须注明这一点及来源 |
| 不分阶段交付，按 M1–M10 全量执行 | 用户指定 |
| 规划文件放在项目根目录（legacy 模式） | 单一任务，无并行计划 |
| 场景使用固定测试数据、英文界面、`#list-top-title` 判定第一行 | 避免各工具“元素顺序断言”能力差异干扰其他指标 |
| 速度数据复用正式版无施压的 100 次运行 | 避免重复跑；N=100 ≥ 20 |
| 场景耗时取自各工具 JUnit XML，套件耗时由 harness 外部计时 | 四个工具都能输出 JUnit，口径统一 |
| 施压配置由 mock server `/config` 下发 | 所有工具共用一份配置，不在各工具中分别设置 |
| 施压每种 N=50；`slow-cpu` 仅 Android；AI 编写每场景最多 10 轮 | 草案自定，用户审阅未提异议，随 v1 预注册 |
| 公开文档用中文 | 用户指定；用户之后自行翻译 |
| jitter 采用方案 (a)：在 METHODOLOGY 写明覆盖范围，开 v2 | 用户决定（2026-11-17）；同时把 Release 构建、设备环境统一设置写入 v2 |
| M3 接入顺序：Detox → Appium → Maestro → Quiesco | 用户采纳建议：Quiesco 最后，避免熟悉 app 的过程只让 Quiesco 受益。注意：M2 走查已使用过 Maestro，对 Maestro 的熟悉度需在易用性数据中披露 |
| 许可证 MIT（版权人写 “rn-e2e-shootout contributors”） | 用户指定 |
| 计划书与规划文件纳入 Git 并公开 | 用户指定 |

## Errors Encountered

| Error | Attempt | Resolution |
|-------|---------|------------|
| `expo run:ios --device <UDID>` 报 `connect ENOENT /var/run/usbmuxd`（枚举物理设备时） | 1 | 改为 `pod install` + `xcodebuild -destination id=<UDID>` + `simctl install` |
| iOS 27：页面内容画在原生标题栏下面（标题栏 y=62–116，内容从 y=0 开始） | 1 | `headerTransparent: false` + `headerStyle.backgroundColor` → 无效 |
| 同上 | 2 | `Screen` 改为 `contentInsetAdjustmentBehavior="automatic"` 的 ScrollView → 无效 |
| 同上 | 3 | 用 `HeaderHeightContext` 在 iOS 上手动加 paddingTop → 截图仍完全相同（连标题栏背景色也没变，怀疑改动未进入 app；入口 bundle 为 lazy，无法直接确认）→ 已达 3 次，上报用户 |
| 同上 | 4（用户同意） | 打 Release 构建：标题栏正常，第 1 次修复（不透明 header）本来就有效；Debug 构建未加载新代码。撤回第 2、3 次改动 |
| iOS：嵌套在 Pressable 里的按钮（`rea-card-action`、`item-delete-*`）不出现在无障碍树中，Maestro 点不到 | 1 | 改为并列结构（卡片标题 / 行主体与按钮为兄弟节点） |

## Notes

- 计划书是规范；若执行中需要改方法，先改计划书 / METHODOLOGY 并升版本号。
- `methodology-v1` tag 打之前不跑任何正式测量。
