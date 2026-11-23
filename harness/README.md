# harness：统一执行器与汇总

计划书第 5 节、METHODOLOGY 6–9 的实现。Node 24，无第三方依赖。

```sh
harness/bin/harness <command> …
```

## 命令

| 命令 | 说明 |
|---|---|
| `run --tool <t> --platform <p> --runs <N> [--variant final\|diagnostic] [--stress <profile>] [--warmup <K>] [--session <name>]` | 一个组合连续运行 N 次（预热默认 0）。结果写到 `results/raw/<session>/` |
| `plan --tools a,b --platforms ios,android --variants final --stress none --runs <N> [--warmup 3] --seed <S> --session <name>` | 正式测量的运行计划：每个组合先预热 K 次，正式运行把全部（工具 × 平台 × 版本 × 施压 × 序号）用固定种子打乱（METHODOLOGY 6.3），写进 `run-order.json`。`slow-cpu` 只排 Android |
| `execute --session <name> [--limit <K>]` | 按 `run-order.json` 执行尚无结果的条目。中断后再执行即从断点继续 |
| `build --tool <t> --platform <p> [--repeat <K>]` | 构建并计时（`results/raw/builds/`）。冷 / 热构建的准备（清缓存、改一个 JS 字符串）由执行者在运行前完成（METHODOLOGY 7） |
| `summarize [--sessions a,b] [--out results/summary.json]` | 汇总全部（或指定的）session |

`<t>`：quiesco / detox / appium / maestro；`<p>`：ios / android；`<profile>`：none / slow-net / slow-cpu / jitter。

## 一次运行做什么

1. **宿主机**：首次执行时检查接电源（否则停止）、Spotlight 索引（开启时警告）；`caffeinate -dimsu` 在 harness 进程存活期间防止睡眠。每次运行前等 1 分钟 load average 降到阈值（`HARNESS_LOAD_THRESHOLD`，默认 8）以下，最多 20 分钟。
2. **模拟器**（同一时刻只运行一个）：
   - iOS：关闭 Android 模拟器与其他 iOS 模拟器，`simctl shutdown` → `boot` → `bootstatus`（5 分钟上限）。关机期间把当前键盘恢复为英文（`KeyboardLastUsed`，S7b 后会停在日文键盘），设置语言 `en` / 地区 `en_US`、关闭减弱动态效果、浅色外观，读回并记录。
   - Android：关闭 iOS 模拟器，结束并以固定参数冷启动模拟器（`-avd Medium_Phone_API_36_AOSP -port 5554 -no-snapshot-load -no-audio -no-window`；`slow-cpu` 加 `-cores 2` 并在模拟器内运行一个占满 1 核的进程），等 `sys.boot_completed`（5 分钟上限）。设置动画缩放 1.0、浅色、语言 en-US，读回并记录。
3. **mock server**：harness 启动并持有（端口 4000），每次运行前 `PUT /config`（施压条件与种子，同时 reset 数据）、清除计时标记。
4. **安装**：卸载后安装该工具的 Release 构建（`suites/<tool>/build/`），计时为 `installMs`。工具自身的安装步骤能跳过的都跳过（Detox `--reuse`、Maestro `SKIP_INSTALL`、Appium `noReset` 时同版本不重装）。
5. **运行工具**：与 M3 相同的命令，30 分钟上限（超时结束进程组，未完成的场景记为 `timeout`）。日志写到 `logs/`。
6. **收集**：JUnit（通过 / 失败 / 跳过、报错）+ 计时标记 → 结果 JSON；JUnit 与标记复制到 `junit/`。运行期间如有宿主机睡眠事件（`pmset -g log`），该次运行标为 `invalid`，不计入统计。

环境错误（开机超时、安装失败等）时 harness 停止且不写该条结果；修复后 `execute` 继续。

## 计时（METHODOLOGY 7）

四套测试在三个时刻向 mock server 发计时标记（`POST /harness/mark`）：

| 标记 | 位置 |
|---|---|
| `scenario-start` | 场景的重置开始前（Vitest：setupFiles 的 `beforeEach`；Jest：`setupFilesAfterEnv` 的 `beforeEach`；mocha：root hook；Maestro：`reset.yaml` 第一步） |
| `reset-end` | 场景中第一次重置结束（`resetApp` 末尾；Maestro：`reset.yaml` 最后一步） |
| `scenario-end` | 场景结束（失败时也发；Maestro：`onFlowComplete`） |

- `resetMs` = `reset-end` − `scenario-start`；`durationMs` = `scenario-end` − `reset-end`。各工具的 JUnit `time` 对重置的包含方式不同（Vitest / Jest 含 `beforeEach`，mocha 不含，Maestro 含 `onFlowStart`），只作参考（`junitTimeMs`）。
- `launchMs` = 工具命令开始 → 第一个 `scenario-start`；`suiteMs` = 第一个 `scenario-start` → 最后一个 `scenario-end`（场景之间 runner 自身的开销，如 Quiesco 的 soft reset，计入 `suiteMs`）；`totalMs` = `installMs + launchMs + suiteMs`。
- 计时标记只用于计时：mock server 不可用时忽略，不影响测试。

测试顺序：四个工具都按场景编号固定顺序执行（Vitest / Jest 自定义 sequencer、WebdriverIO 排序后的 `specs`、Maestro `config.yaml` 的 `executionOrder`）。

## 结果

- `results/raw/<session>/run-order.json`：计划（种子、条目）。
- `results/raw/<session>/NNNN-<tool>-<platform>-<variant>-<stress>-{w,r}<i>.json`：每次运行一个，字段见计划书第 5 节，另有 `totalMs`、`toolWallMs`、`exitCode`、`timedOut`、`invalid`、`sleepEvents`、`environment`（负载、设备环境、模拟器参数、mock 配置）。场景的 `status`：passed / failed / skipped / timeout / missing。
- `results/summary.json`：按（工具 × 平台 × 版本 × 施压）分组。耗时 median / p90（线性插值）/ min / max，只统计通过的场景；整套耗时只统计全绿的运行。失败率 + 95% Wilson 区间（整套 / 按场景），skipped 不计入分母，N 次全部失败的场景标为 `neverPassed`。

## 测试

```sh
cd harness && npm test
```
