# 测量方法

> 方法版本：**v13**（2026-11-23，待确认；v12 为 2026-11-22，tag `methodology-v12`；v11 为 2026-11-22，tag `methodology-v11`；v10 为 2026-11-22，tag `methodology-v10`；v9 为 2026-11-21，tag `methodology-v9`；v8 为 2026-11-21，tag `methodology-v8`；v7 为 2026-11-21，tag `methodology-v7`；v6 为 2026-11-20，tag `methodology-v6`；v5 为 2026-11-20，tag `methodology-v5`；v4 为 2026-11-19，tag `methodology-v4`；v3 为 2026-11-17，tag `methodology-v3`；v1 为 2026-11-17 预注册的初版，各版改动见第 13 节）。本文件只能通过新开版本修改（v2、v3、v4、v5、v6、v7、v8、v9、v10、v11、v12、v13 …），并在第 13 节记录改动原因；改动后所有工具用新方法重跑。官网引用的每个数字都注明所用的方法版本。

场景定义见 [`scenarios.md`](scenarios.md)。本文件定义**怎么跑、怎么计数、怎么统计、怎么报告**。

---

## 1. 立场披露

本项目由 Quiesco 的作者发起，结果会用于 Quiesco 官网。为了抵消这一立场带来的偏差，本项目采取以下措施：方法预注册（本文件）、公开全部实现和原始数据、邀请各工具的使用者 review 实现、发布全部预注册指标（包括 Quiesco 不占优的指标）。

---

## 2. 被测对象与版本

### 2.1 工具

| 工具 | 版本 | 测试写法 |
|---|---|---|
| Quiesco | `quiesco` 0.13.3（含 `@quiesco/*` 0.13.3） | Vitest（`@quiesco/vitest`） |
| Detox | 20.51.4 | Jest |
| Appium | 4.0.0（XCUITest / UiAutomator2 driver 版本在接入时记录） | WebdriverIO 10.2.0 |
| Maestro | 2.11.0 | YAML flows |

测量期间不升级任何工具。如果正式测量开始前某个工具发布了新版本，统一升级后重跑全部测量，不混用版本的数据。

### 2.2 app 与环境

| 项目 | 值 |
|---|---|
| Expo SDK | 58（`expo` 58.0.25），Expo Router，New Architecture |
| Node | 24.22.1 |
| 宿主机 | Apple M5 Pro（15 核），24 GB 内存，macOS 26.7.2 |
| Xcode | 27.2 (27B52) |
| iOS 设备 | iPhone 17 模拟器，iOS 27.0 |
| Android 设备 | `Medium_Phone_API_36_AOSP` 模拟器：android-36 `default`（AOSP）arm64-v8a，medium_phone，4 核 / 2 GB |
| Android 设备（仅 C2） | `Medium_Phone_API_36_GAPIS` 模拟器：android-36 `google_apis` arm64-v8a，配置同上（AOSP 镜像没有浏览器，C2 需要 Custom Tabs） |
| Web | Chromium（版本在接入时记录；各工具使用的浏览器版本须一致） |

以上每一项都写进每次运行的结果 JSON（`toolVersion`、`device`、`host` 等字段）。

**Android 设备的选择理由（v3）**：v1 / v2 使用 API 37 `google_apis_playstore`。实测 Detox 20.51.4 在 Android 37 上无法运行（app 启动即崩溃：`NoSuchMethodException: android.hardware.input.InputManager.getInstance`，该隐藏 API 在 Android 37 被移除）；Detox 官方 Android 环境指南强烈建议使用 AOSP `default` 镜像。为让四个工具在同一台设备上对比，改用 Detox 能运行且官方推荐的 API 36 AOSP 镜像。AOSP 镜像没有浏览器，因此只有 C2 在同配置的 `google_apis` 镜像上检查；C2 只记 ✓ / ✗，不参与速度和稳定性统计。

**构建类型**：所有测量（速度、稳定性、施压、版本矩阵）一律使用 **Release 构建**（JS bundle 内嵌，不连接 Metro）。Debug 构建在实测中出现过代码改动未生效、启动时额外的系统权限弹窗等问题，不用于任何测量。各工具接入时如需对 Release 构建做额外配置（例：ProGuard keep 规则），计入该工具的易用性数据。

---

## 3. 两种实现版本

| 版本 | 定义 | 用途 |
|---|---|---|
| **诊断版**（`diagnostic`） | 不加任何 W1 / W2 / W3 等待（见第 4 节） | 观察各工具“开箱即用”时的同步能力。对依赖条件等待的工具（如 Appium）这不是惯用写法，**不代表该工具的正常用法** |
| **正式版**（`final`） | 按官方惯用写法实现，补等待直到稳定 | 速度、稳定性、易用性的主要数据 |

正式版的完成标准：iOS 和 Android 上连续 5 次全绿，或已记录 ✗ 的原因。

---

## 4. 等待与同步绕过的计数

### 4.1 分类

| 类别 | 定义 | 例子 | 评价 |
|---|---|---|---|
| **W1 固定 sleep** | 与 app 状态无关的固定延时 | `sleep(1000)`、`setTimeout` 等待、Maestro `waitForAnimationToEnd` 以外的固定秒数等待 | 坏味道 |
| **W2 手写重试 / 轮询** | 测试代码中自行编写的重试或轮询逻辑 | retry 循环、对单步的 try/catch 重试 | 坏味道 |
| **W3 条件等待** | 使用工具提供的 API 等待某个元素或状态 | WebdriverIO `waitForDisplayed`、Detox `waitFor().withTimeout()`、Maestro `extendedWaitUntil` | 官方惯用写法，**不扣分**，只作参考 |
| **X 同步绕过** | 为了让工具的同步机制不挂起而做的改动 | 关闭同步、配置忽略某些 URL / 动画 / timer、在 app 中为测试关闭动画 | 单独报告，与 S11 / S15 / S16 一起展示 |

### 4.2 计数规则

- 只统计**为了稳定而加的**等待。工具 API 本身附带的隐式等待（例：Maestro 的每一步都会自动等待）不计数。
- 每一处等待计 1，按调用点计数，不按执行次数计数；写在共用辅助函数里的等待计 1，不按调用次数相乘。
- 每个工具在 `suites/<tool>/WAITS.md` 中列出每一处等待和同步绕过：文件、行号、类别、为什么需要。计数由该清单得出，M8 外部 review 时一并检查。

---

## 5. 状态重置

每个场景开始前：

1. 服务端：调用 mock server 的 `POST /reset`。
2. app 端：清除 app 数据（登录态、AsyncStorage、缓存），然后冷启动 app。**不重新安装**。

各工具用自己的官方方式实现第 2 步，具体做法在接入时实测并记录在下表（M3 填写）：

| 工具 | iOS | Android | Web |
|---|---|---|---|
| Quiesco | Quiesco 默认的 soft reset（app 内清 AsyncStorage、重置导航并重新挂载）粒度不同，另外用 Quiesco API 补齐：`app.device.setPermission('location', 'reset')`（`simctl privacy reset`）→ `app.device.relaunch({ clearData: true })`（清空数据容器、删除 UserDefaults，冷启动） | Quiesco API：`app.device.relaunch({ clearData: true })`（`pm clear`，同时撤销运行时权限） | 待填 |
| Detox | 外部命令补齐：结束 app → 清空数据容器（`simctl get_app_container … data` 下的 Library / Documents / tmp）→ `simctl privacy reset all` → `launchApp({ newInstance: true })`（Detox 只有卸载重装 `delete: true`） | 外部命令补齐：`adb shell pm clear` → `launchApp({ newInstance: true })` | — |
| Appium | 全部用 Appium API：`mobile: clearApp`（仅模拟器；结束 app 并清空数据容器）→ `mobile: simctl` `privacy reset all <bundleId>` → `mobile: launchApp` | 全部用 Appium API：`mobile: clearApp`（`pm clear`，同时结束进程、撤销运行时权限）→ `mobile: activateApp` | — |
| Maestro | 外部命令补齐（Maestro 的 `clearState` 在 iOS 上会重装 app）：`runScript` 经本地 HTTP 小服务执行 `simctl terminate` → 清空数据容器 → `simctl privacy reset all`，再 `launchApp`（`permissions: { all: unset }`，因为 `launchApp` 默认授予全部权限） | Maestro 官方：`launchApp: { clearState: true, permissions: { all: unset } }`（`clearState` = `pm clear`） | 待填 |

如果某个工具的 runner 自带重置（例：`@quiesco/vitest` 在每个测试前 reset），需要确认其粒度与上述规则一致；不一致时以本规则为准，另行补齐。

重置耗时单独计时（`resetMs`），不计入场景耗时。

---

## 6. 执行规则

### 6.1 重试

所有工具都**关闭自动重试**（Jest `retryTimes`、WebdriverIO `specFileRetries` / `mochaOpts.retries`、Maestro 的重试、Vitest `retry` 等）。flake 率只统计第一次运行的结果。

### 6.2 运行次数

| 测量 | 每个（工具 × 平台 × 版本 × 施压条件）的次数 |
|---|---|
| 预热 | 3 次，标记 `warmup: true`，不计入统计 |
| 速度 | N = 20（不含预热） |
| 稳定性（无施压） | N = 100 |
| 稳定性（每种施压条件） | N = 50 |

速度数据不单独跑，直接复用正式版、无施压条件的 100 次稳定性运行（N = 100，满足 N ≥ 20）。

### 6.3 交错执行

正式测量时，不按工具连续跑完。把全部（工具 × 平台 × 运行序号）组合打乱后依次执行，一个单元是一次完整的套件运行。打乱用固定随机种子，种子写进结果目录的 `run-order.json`。同一时刻只运行一个模拟器 / 浏览器。

### 6.4 环境控制

- 宿主机接电源；用 `caffeinate -dimsu` 防止休眠。
- 关闭 Spotlight 索引（`mdutil -i off`）、自动更新和其他应用。
- 每次套件运行前重启模拟器（上一次运行遗留的系统弹窗不会随 app 重启消失）。
- 每次套件运行前由 harness 统一设置并记录设备环境，不依赖宿主机或模拟器的现有设置：

| 项目 | iOS 模拟器 | Android 模拟器 | Web 浏览器 |
|---|---|---|---|
| 语言 / 地区 | `en` / `en_US` | `en-US` | locale `en-US` |
| 动画 | 关闭“减弱动态效果”（Reduce Motion） | 窗口 / 转场 / Animator 动画缩放均为 1.0 | `prefers-reduced-motion: no-preference` |
| 外观 | 浅色 | 浅色 | `prefers-color-scheme: light` |

  C8（深色模式）、C10（系统语言）在检查过程中按需临时改变上述设置。
- 测量期间不在宿主机上做其他工作。

### 6.5 超时

各工具使用默认的元素等待超时。如果修改了超时，计入 W3 并记录原因。整套运行设置 30 分钟的硬上限，超过则该次运行所有未完成的场景记为失败（`timeout`）。

---

## 7. 时间的定义

| 字段 | 起点 | 终点 |
|---|---|---|
| `buildMs` | 开始 e2e 构建 | 构建产物生成 |
| `installMs` | 开始安装到模拟器 | 安装完成 |
| `launchMs` | 发出启动命令 | 第一个场景的第一步开始 |
| `resetMs` | 场景开始前的重置开始 | 重置完成（app 冷启动完成） |
| `durationMs`（场景） | 场景第一步开始 | 场景最后一个断言完成 |
| `suiteMs` | 第一个场景开始 | 最后一个场景结束（含场景之间的重置） |

- 整套耗时报告两个数字：`suiteMs`（不含安装与启动）和 `installMs + launchMs + suiteMs`（含安装与启动）。
- 构建分冷构建和热构建：
  - **冷构建**：清除 `ios/build`、DerivedData、Gradle 构建缓存后构建。
  - **热构建**：在一次成功构建之后，修改一个 JS 文件中的字符串再构建。
  - 各测 5 次，报告 median。
- 场景耗时取自各工具输出的 JUnit XML（Vitest、Jest、WebdriverIO、Maestro 都能输出），harness 统一解析；`suiteMs` 等由 harness 在外部计时。

---

## 8. 稳定性指标

### 8.1 定义

- **场景失败率**：某场景在 N 次运行中失败的次数 / N。
- **套件失败率**：N 次运行中至少有一个场景失败的次数 / N。
- **flake** 指“同一份代码在相同条件下有时通过、有时失败”。某个场景如果 N 次全部失败，记为“未通过”（不算 flake），在结果中单独标出。

### 8.2 置信区间

失败率附 95% Wilson 置信区间：

```
p̂ = k / n,  z = 1.96
center = (p̂ + z²/(2n)) / (1 + z²/n)
half   = z · sqrt(p̂(1−p̂)/n + z²/(4n²)) / (1 + z²/n)
CI     = [center − half, center + half]
```

### 8.3 比较规则

两个工具的失败率 95% 置信区间**重叠**时，不宣称谁更稳定，只写“无显著差异”。

### 8.4 施压条件

| 名称 | 内容 | 适用平台 |
|---|---|---|
| `slow-net` | mock server 对每个请求加 500–2000 ms 的随机延迟（均匀分布，固定种子） | 全部 |
| `slow-cpu` | Android 模拟器以 2 个 CPU 核启动（`-cores 2`），并在模拟器内运行一个占用 1 核的后台进程 | Android |
| `jitter` | app 自身控制的动画时长乘以 0.5–3.0 之间的随机系数（固定种子），覆盖范围见下表 | 全部 |

`jitter` 的覆盖范围（由原生或第三方库控制时长的动画，app 无法改变，不在范围内）：

| 受 jitter 影响 | 不受 jitter 影响 |
|---|---|
| iOS 页面转场（native-stack `animationDuration`）<br>确认 Modal 淡入（A4）<br>Toast 淡入淡出（显示时长固定 2 秒）<br>永不静止的循环动画（A11）<br>Reanimated 弹簧动画（A13） | Android 页面转场（native-stack 的时长设置只对 iOS 生效）<br>左滑删除的回弹（`ReanimatedSwipeable`）<br>下拉刷新（`RefreshControl`）<br>系统日期选择器、系统权限弹窗、系统分享面板<br>长按菜单（无动画） |

这与真实 app 一致：系统和第三方组件的动画本来就不由 app 控制。

施压配置由 mock server 的 `/config` 接口下发，app 启动时读取；所有工具使用同一份配置，不需要在各工具中分别设置。

---

## 9. 速度指标

- 报告 median、p90、min、max。
- 分场景耗时和整套耗时两个粒度。
- 只统计**通过**的场景的耗时；失败的场景只计入稳定性。

---

## 10. 易用性指标

### 10.1 AI 编写效率（主指标）

- 使用同一个 LLM（固定模型 ID，M7 开始前确定并写入本节）。
- 每个工具使用同一段提示词模板，输入只有 `scenarios.md`、app 的 `testID` 清单、该工具的官方文档链接，以及已接入好的空测试工程。
- 每轮把测试的运行输出原样反馈给模型，不加人工提示。每个场景最多 10 轮。
- 记录：每个场景通过所需的轮数、最终通过的场景数。
- 每个工具重复 3 次，取 median。
- 提示词和全部对话记录公开在 `results/ai-authoring/`。

### 10.2 首个测试通过所需时间

- 从 `create-expo-app` 之后的干净 app 开始，按该工具的官方文档接入，到 S1 第一次变绿为止，录屏计时。
- 由不熟悉这四个工具的人执行。如果做不到，结果中明确写出执行者是 Quiesco 作者，这一项仅供参考。

### 10.3 其他

| 指标 | 定义 |
|---|---|
| 接入步骤数 | 按官方文档执行的命令数 + 手动操作数（编辑文件、点击 IDE 设置等），各自列出 |
| 改动文件数 | 原生代码、app 代码、配置文件分开统计；以接入前后的 `git diff --stat` 为准 |
| 测试代码量 | S1–S23 正式版的代码行数，用 `scc` 统计，去掉空行和注释；共用辅助代码和配置文件分开列出。不同格式（YAML / JS / TS）之间行数不可直接比较，只作参考 |
| 等待数 | 第 4 节的 W1 / W2 / W3 / X 分别统计 |
| 报错可读性 | 对 S1 制造三类失败：① 找不到元素（把 `#login-submit` 改成不存在的 testID）；② 断言失败（期望文字改为 `Item 999`）；③ 超时（mock server 让 `/items` 延迟 120 秒）。截取各工具的原始报错并排展示，不打分 |

---

## 11. Expo 版本矩阵

- SDK 范围：执行时的最新版向前 5 个版本（当前为 54–58）。
- 每格只跑正式版 S1，iOS 和 Android 各一次，记 ✓ / ✗ / 需额外配置（附说明）。
- 不同 SDK 需要的 Xcode / Android 镜像版本写进每格的说明。
- Quiesco 在 SDK 55 以下的格子照实标 ✗，不从矩阵中删掉。
- 另外分开标注各工具对 Expo Go / dev client / prebuild / EAS Build / New Architecture 的支持。

---

## 12. 报告规则

- 预注册的所有指标都发布，不事后挑选。
- 官网引用的每个数字注明：方法版本、工具版本、测量日期、硬件。
- 速度数字以第 2.2 节的本地机器为准；CI 上的数据只用来跟踪稳定性和版本兼容性。
- 外部 review 指出实现不公平时，修正后重跑受影响的测量，并在仓库中记录 review 意见和处理方式。

## 13. 改动记录

| 版本 | 日期 | 改动 | 原因 |
|---|---|---|---|
| v1 | 2026-11-17 | 初版 | — |
| v2 | 2026-11-17 | ① 8.4 写明 `jitter` 的实际覆盖范围（原文为“app 内所有动画”）；② 2.2 规定所有测量只用 Release 构建；③ 6.4 增加 harness 统一设置设备环境（语言、动画、外观）并要求重启模拟器的理由 | M2 实现与走查中发现：部分动画时长由原生 / 第三方库控制，app 无法改变；Debug 构建不可靠；宿主机的模拟器和浏览器为日文、iOS 模拟器开启了 Reduce Motion，会影响 C10、S15 等结果。v2 制定时尚无任何测量数据 |
| v3 | 2026-11-17 | ① 2.2 Android 测量设备由 API 37 `google_apis_playstore` 改为 API 36 AOSP `default`；C2 改在 API 36 `google_apis` 上检查；② scenarios.md C1 补充 iOS 失败路径的操作（系统提示重试时点“取消”），判定标准不变 | ① Detox 20.51.4 在 Android 37 上无法运行（实测），且官方建议 AOSP 镜像；为保证四个工具在同一设备上对比而更换（用户决定，2026-11-17）。AOSP 镜像无浏览器，C2 需要 Custom Tabs。② iOS 上 Face ID 匹配失败后系统提示重试，`authenticateAsync` 需点“取消”才返回失败（实测）。v3 制定时尚无任何测量数据（M3 实现阶段） |
| v4 | 2026-11-19 | ① 2.1 Quiesco 0.5.0 → 0.8.0；② 披露：Quiesco 的接入使用了 Quiesco 官方的 Claude Code 插件（`quiesco@h2nology` 0.7.0 / 0.8.0：setup / writing-tests / quiesco-api / debug 技能），其他三个工具没有对应插件，接入时只依据官方文档 | ① Quiesco 在 M3 接入前发布 0.7.0，按第 2.1 节“正式测量开始前统一升级”的规则升级（用户决定，2026-11-19）；同日接入完成后发布 0.8.0（修复接入中提交的 h2nology/quiesco#44–#55），v4 尚未打 tag，直接改为 0.8.0 并重跑 Quiesco 的 M3（用户决定，2026-11-19）；其他工具版本不变。② 插件会影响易用性数据（接入步骤、首个测试通过时间、AI 编写效率），必须与结果一起报告。v4 制定时尚无任何测量数据（M3 实现阶段，Quiesco 尚未接入） |
| v5 | 2026-11-20 | ① 2.1 Quiesco 0.8.0 → 0.9.0；② 插件披露的版本加上 `quiesco@h2nology` 0.9.0（内容不变） | ① M3 期间 Quiesco 发布 0.9.0（关闭 #63–#68），按第 2.1 节“正式测量开始前统一升级”的规则升级（用户决定，2026-11-20）；其他工具版本不变。v5 制定时尚无正式测量数据（M3 实现阶段） |
| v6 | 2026-11-20 | ① 2.1 Quiesco 0.9.0 → 0.10.0；② 插件披露的版本加上 `quiesco@h2nology` 0.10.0（内容不变） | ① M3 期间 Quiesco 发布 0.10.0（关闭 #73–#78），按第 2.1 节“正式测量开始前统一升级”的规则升级（用户决定，2026-11-20）；其他工具版本不变。v6 制定时尚无正式测量数据（M3 实现阶段） |
| v7 | 2026-11-21 | ① 2.1 Quiesco 0.10.0 → 0.11.0；② 插件披露的版本加上 `quiesco@h2nology` 0.11.0（内容不变） | ① M3 期间 Quiesco 发布 0.11.0（关闭 #82–#87），按第 2.1 节“正式测量开始前统一升级”的规则升级（用户决定，2026-11-20）；其他工具版本不变。v7 制定时尚无正式测量数据（M3 实现阶段） |
| v8 | 2026-11-21 | ① 2.1 Quiesco 0.11.0 → 0.12.0；② 插件披露的版本加上 `quiesco@h2nology` 0.12.0（内容不变） | ① M3 期间 Quiesco 发布 0.12.0（关闭 #92–#96），按第 2.1 节“正式测量开始前统一升级”的规则升级（用户要求，2026-11-21）；其他工具版本不变。v8 制定时尚无正式测量数据（M3 实现阶段） |
| v9 | 2026-11-21 | ① 2.1 Quiesco 0.12.0 → 0.12.1；② 插件披露的版本加上 `quiesco@h2nology` 0.12.1（内容不变） | ① M3 期间 Quiesco 发布 0.12.1（关闭 #100），按第 2.1 节“正式测量开始前统一升级”的规则升级（用户要求，2026-11-21）；其他工具版本不变。v9 制定时尚无正式测量数据（M3 实现阶段） |
| v10 | 2026-11-22 | ① 2.1 Quiesco 0.12.1 → 0.13.0；② 插件披露的版本加上 `quiesco@h2nology` 0.13.0（内容不变） | ① M3 期间 Quiesco 发布 0.13.0（关闭 #102，只改 `@quiesco/agent` 的 frame-stable 诊断输出，空闲判定不变），按第 2.1 节“正式测量开始前统一升级”的规则升级（用户要求，2026-11-21）；其他工具版本不变。v10 制定时尚无正式测量数据（M3 实现阶段） |
| v11 | 2026-11-22 | ① 2.1 Quiesco 0.13.0 → 0.13.1；② 插件披露的版本加上 `quiesco@h2nology` 0.13.1（内容不变） | ① M3 期间 Quiesco 发布 0.13.1（关闭 #104，只改 iOS `@quiesco/native` 的键盘 “moving” 判定），按第 2.1 节“正式测量开始前统一升级”的规则升级（用户要求，2026-11-22）；其他工具版本不变。v11 制定时尚无正式测量数据（M3 实现阶段） |
| v12 | 2026-11-22 | ① 2.1 Quiesco 0.13.1 → 0.13.2；② 插件披露的版本加上 `quiesco@h2nology` 0.13.2（内容不变） | ① M3 期间 Quiesco 发布 0.13.2（关闭 #107，只改 `@quiesco/agent`：带回调的原生调用在第一次回调前算忙碌，timeline 记录空闲等待如何结束），按第 2.1 节“正式测量开始前统一升级”的规则升级（用户要求，2026-11-22）；其他工具版本不变。v12 制定时尚无正式测量数据（M3 实现阶段） |
| v13 | 2026-11-23 | ① 2.1 Quiesco 0.13.2 → 0.13.3；② 插件披露的版本加上 `quiesco@h2nology` 0.13.3（内容不变） | ① M3 期间 Quiesco 发布 0.13.3（关闭 #109、#110，只改 `@quiesco/agent`：事件订阅 `add…Listener` 不再算作等待回调，`SYNC_TIMEOUT` 报错列出最近忙碌过的 tracker；`@quiesco/core` 只改 timeline），按第 2.1 节“正式测量开始前统一升级”的规则升级（用户要求，2026-11-22）；其他工具版本不变。v13 制定时尚无正式测量数据（M3 实现阶段） |
