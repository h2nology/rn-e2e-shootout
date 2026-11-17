# Progress Log

## Session: 2026-11-17

### Phase 0: 计划书定稿

- **Status:** complete
- Actions taken:
  - 审阅并两轮修订 `e2e-comparison-plan.md`（公平性、统计方法、A12–A28、S12–S23、C1–C11）
  - 确定 Quiesco 0.5.0 + Vitest、scheme `rnshootout`
- Files created/modified:
  - `e2e-comparison-plan.md`

### Phase 1: M1 仓库骨架与预注册文档

- **Status:** complete
- **Started:** 2026-11-17
- Actions taken:
  - 初始化规划文件（task_plan.md / findings.md / progress.md）
  - 盘点宿主机环境与 npm 最新版本（见 findings.md）
  - `git init -b main`，按计划书第 1 节建目录骨架（各目录放 `.gitkeep`），加 `.gitignore`
  - 起草 `scenarios.md`（S1–S23、C1–C11、测试数据、界面契约、平台适用性）
  - 起草 `METHODOLOGY.md`（v1 草案：版本、诊断版/正式版、W1–W3/X、重置、重试、N、交错、时间定义、Wilson、施压、易用性、矩阵、报告规则）
  - 起草 `README.md`（含立场披露）
  - 用户确认：中文文档、MIT、规划文件入 Git
  - 加 `LICENSE`；文档状态改为 v1 预注册；首次 commit 并打 tag `methodology-v1`

### Phase 2: M2 被测 app + mock server

- **Status:** in_progress
- **Started:** 2026-11-17
- Actions taken:
  - `create-expo-app --template default@sdk-58` 生成 `app/`（未安装依赖；删除模板自带 LICENSE）
  - 实现 mock-server（Node 24 原生 TS + `ws`）：reset / config（施压）/ 测试注入 / 业务接口 / WebView 与 OAuth 页面 / 延迟图片 / WebSocket / iOS 推送脚本
  - curl 冒烟测试通过（见 Test Results）
  - app：配置 app.json（name/scheme `rnshootout`、bundle id / package `com.rnshootout.app`、ATS / cleartext、各权限插件、orientation default、web.output single）
  - app：安装依赖；删除模板示例代码；实现 lib（api / anim(jitter) / store / i18n）、组件（ui / toast / confirm-modal / date-field(.web) / web-frame(.web)）
  - app：实现全部路由（login、tabs：home / explore(嵌套 stack) / settings、item/[id]、add、controls、permission、webview、busy、reanimated、live、reorder、long-form、notification-target、biometric、system、dup、nested、image、auth）
  - `npx tsc --noEmit` 通过
- Files created/modified:
  - `app/**`、`mock-server/**`
- Files created/modified:
  - `task_plan.md`、`findings.md`、`progress.md`
  - `.gitignore`、`README.md`、`scenarios.md`、`METHODOLOGY.md`、各目录 `.gitkeep`

## Test Results

| Test | Input | Expected | Actual | Status |
|------|-------|----------|--------|--------|
| mock-server 冒烟 | `GET /items?q=Item 04` | 10 条（Item 040–049） | 10 条 | pass |
| mock-server 冒烟 | `POST /login` 正确 / 错误 | 200 / 401 | 200 / 401 | pass |
| mock-server 冒烟 | `POST /items` | id 501 | id 501 | pass |
| mock-server 冒烟 | `/test/fail` count=1 后两次 `GET /items` | 500 → 200 | 500 → 200 | pass |
| mock-server 冒烟 | `WS /ws` | 每 500 ms 一条 | 收到 tick 1、2 | pass |
| mock-server 冒烟 | `GET /image.png` | ≈1.5 s + 网络延迟 | 2.02 s，64×64 PNG | pass |

## Error Log

| Timestamp | Error | Attempt | Resolution |
|-----------|-------|---------|------------|
|           |       | 1       |            |
