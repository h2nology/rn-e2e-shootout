# mock-server

被测 app 使用的 API 服务。测试数据见 [`../scenarios.md`](../scenarios.md) 第 0.2 节，施压条件见 [`../METHODOLOGY.md`](../METHODOLOGY.md) 第 8.4 节。

```sh
npm install
npm start            # http://localhost:4000（PORT 环境变量可改）
```

Android 模拟器上先执行 `adb reverse tcp:4000 tcp:4000`，app 统一访问 `http://localhost:4000`。

## 接口

### 测试控制（不加网络延迟，不受错误注入影响）

| 接口 | 说明 |
|---|---|
| `POST /reset` | 恢复初始数据，清除错误 / 延迟注入（保留当前施压配置） |
| `GET /config` | 当前施压配置（app 启动时读取） |
| `PUT /config` | `{"stress":"none|slow-net|slow-cpu|jitter","seed":1}`，也可直接覆盖各字段 |
| `POST /test/items` | `{"title":"Server item"}` 在服务端新增一条，排在最前（S13） |
| `POST /test/fail` | `{"route":"/items","status":500|"timeout","count":1}`（S18） |
| `POST /test/delay` | `{"route":"/items","ms":120000,"count":1}`（报错可读性 ③） |
| `GET /health` | 健康检查 |

### 页面

| 接口 | 说明 |
|---|---|
| `GET /webview` | S9 的 WebView 页面 |
| `GET /oauth/authorize?redirect_uri=...` | C2 的 OAuth 式登录页 |

### 业务接口（加网络延迟，应用注入规则）

| 接口 | 说明 |
|---|---|
| `POST /login` | `{"email","password"}`，成功返回 token，失败 401 |
| `GET /items?q=` | 条目列表（可搜索） |
| `POST /items` | 新增条目，id 从 501 开始 |
| `GET /items/:id`、`DELETE /items/:id` | 详情 / 删除 |
| `POST /items/:id/pin` | 置顶 |
| `GET /poll` | 轮询（A14） |
| `POST /greet` | `{"name"}` → `Hello, <name>`（S16） |
| `GET /image.png` | 延迟 1.5 秒返回图片（C7） |
| `WS /ws` | 每 500 ms 推送一条消息（A14） |

## 推送（C11）

- iOS：`sh scripts/push-ios.sh [device]`（`xcrun simctl push`）。
- Android：模拟器没有可直接注入远程推送的官方命令（需要 FCM），实现方式在 M3 实测后记录。
