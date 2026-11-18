// rn-e2e-shootout mock server
// 依据 scenarios.md 第 0.2 节的测试数据和 METHODOLOGY.md 第 8.4 节的施压条件实现。
// 运行：node src/server.ts（Node 24 原生类型擦除）

import http from 'node:http';
import { URL } from 'node:url';
import { WebSocketServer } from 'ws';
import { createRng, type Rng } from './rng.ts';
import { pages } from './pages.ts';
import { PNG_IMAGE } from './image.ts';

const PORT = Number(process.env.PORT ?? 4000);

// ---------- 状态 ----------

type Item = { id: number; title: string };

type StressConfig = {
  /** 施压条件名，写进结果 JSON；none / slow-net / slow-cpu / jitter */
  stress: string;
  /** 每个请求的延迟（毫秒）。min == max 时为固定延迟 */
  netDelayMinMs: number;
  netDelayMaxMs: number;
  /** 动画时长系数范围，app 读取后自行乘到动画时长上 */
  animScaleMin: number;
  animScaleMax: number;
  /** 随机种子 */
  seed: number;
};

type FailRule = { route: string; status: number | 'timeout'; count: number };
type DelayRule = { route: string; ms: number; count: number };

const DEFAULT_CONFIG: StressConfig = {
  stress: 'none',
  netDelayMinMs: 200,
  netDelayMaxMs: 200,
  animScaleMin: 1,
  animScaleMax: 1,
  seed: 1,
};

const PROFILES: Record<string, Partial<StressConfig>> = {
  none: {},
  'slow-net': { netDelayMinMs: 500, netDelayMaxMs: 2000 },
  // slow-cpu 在模拟器侧施加，服务端无变化
  'slow-cpu': {},
  jitter: { animScaleMin: 0.5, animScaleMax: 3.0 },
};

let config: StressConfig;
let rng: Rng;
let items: Item[];
let nextId: number;
let failRules: FailRule[];
let delayRules: DelayRule[];
let pollTick: number;

function seedItems(): Item[] {
  return Array.from({ length: 500 }, (_, i) => ({
    id: i + 1,
    title: `Item ${String(i + 1).padStart(3, '0')}`,
  }));
}

function reset(keepConfig = true) {
  if (!keepConfig || !config) config = { ...DEFAULT_CONFIG };
  rng = createRng(config.seed);
  items = seedItems();
  nextId = 501;
  failRules = [];
  delayRules = [];
  pollTick = 0;
}
reset(false);

// ---------- 工具函数 ----------

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function send(res: http.ServerResponse, status: number, body: unknown) {
  const data = typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(status, {
    'content-type': typeof body === 'string' ? 'text/html; charset=utf-8' : 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-headers': '*',
    'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'cache-control': 'no-store',
  });
  res.end(data);
}

async function readJson(req: http.IncomingMessage): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return {};
  }
}

function netDelay(): number {
  const { netDelayMinMs: min, netDelayMaxMs: max } = config;
  return min === max ? min : Math.round(min + rng() * (max - min));
}

/** 应用错误注入和延迟注入。返回 true 表示已经响应（失败），调用方不再处理 */
async function applyRules(path: string, res: http.ServerResponse): Promise<boolean> {
  const delay = delayRules.find((r) => r.route === path && r.count > 0);
  if (delay) {
    delay.count -= 1;
    await sleep(delay.ms);
  }
  const fail = failRules.find((r) => r.route === path && r.count > 0);
  if (fail) {
    fail.count -= 1;
    if (fail.status === 'timeout') {
      // 不响应，直到客户端放弃
      return true;
    }
    send(res, fail.status, { error: 'injected failure' });
    return true;
  }
  return false;
}

function filterItems(q: string | null): Item[] {
  if (!q) return items;
  const needle = q.toLowerCase();
  return items.filter((i) => i.title.toLowerCase().includes(needle));
}

// ---------- 路由 ----------

async function handle(req: http.IncomingMessage, res: http.ServerResponse) {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const path = url.pathname;
  const method = req.method ?? 'GET';

  if (method === 'OPTIONS') return send(res, 204, '');

  // 测试控制接口：不加延迟，不受错误注入影响
  if (path === '/reset' && method === 'POST') {
    reset(true);
    return send(res, 200, { ok: true });
  }
  if (path === '/config' && method === 'GET') {
    return send(res, 200, config);
  }
  if (path === '/config' && method === 'PUT') {
    const body = await readJson(req);
    const profile = PROFILES[body.stress ?? 'none'];
    if (!profile) return send(res, 400, { error: `unknown stress profile: ${body.stress}` });
    config = { ...DEFAULT_CONFIG, ...profile, ...body };
    reset(true);
    return send(res, 200, config);
  }
  if (path === '/test/fail' && method === 'POST') {
    const body = await readJson(req);
    failRules.push({ route: body.route, status: body.status ?? 500, count: body.count ?? 1 });
    return send(res, 200, { ok: true });
  }
  if (path === '/test/delay' && method === 'POST') {
    const body = await readJson(req);
    delayRules.push({ route: body.route, ms: body.ms ?? 0, count: body.count ?? 1 });
    return send(res, 200, { ok: true });
  }
  if (path === '/test/items' && method === 'POST') {
    const body = await readJson(req);
    const item = { id: nextId++, title: String(body.title ?? 'Server item') };
    items.unshift(item);
    return send(res, 200, item);
  }
  if (path === '/health') return send(res, 200, { ok: true });

  // 页面（WebView / OAuth）：不加网络延迟
  if (path === '/webview' && method === 'GET') return send(res, 200, pages.webview());
  if (path === '/oauth/authorize' && method === 'GET') {
    return send(res, 200, pages.oauth(url.searchParams.get('redirect_uri') ?? 'rnshootout://auth'));
  }

  // 以下为 app 使用的业务接口：加网络延迟，并应用注入规则
  await sleep(netDelay());
  if (await applyRules(path, res)) return;

  if (path === '/login' && method === 'POST') {
    const body = await readJson(req);
    if (body.email === 'user@example.com' && body.password === 'Passw0rd!') {
      return send(res, 200, { token: 'token-user', email: body.email });
    }
    return send(res, 401, { error: 'Invalid credentials' });
  }

  if (path === '/items' && method === 'GET') {
    return send(res, 200, { items: filterItems(url.searchParams.get('q')) });
  }
  if (path === '/items' && method === 'POST') {
    const body = await readJson(req);
    const item = { id: nextId++, title: String(body.title ?? '') };
    items.unshift(item);
    return send(res, 200, item);
  }

  const itemMatch = path.match(/^\/items\/(\d+)(\/pin)?$/);
  if (itemMatch) {
    const id = Number(itemMatch[1]);
    const idx = items.findIndex((i) => i.id === id);
    if (idx < 0) return send(res, 404, { error: 'not found' });
    if (itemMatch[2] && method === 'POST') {
      const [item] = items.splice(idx, 1);
      items.unshift(item);
      return send(res, 200, item);
    }
    if (method === 'GET') return send(res, 200, items[idx]);
    if (method === 'DELETE') {
      items.splice(idx, 1);
      return send(res, 200, { ok: true });
    }
  }

  if (path === '/poll' && method === 'GET') {
    pollTick += 1;
    return send(res, 200, { tick: pollTick });
  }

  if (path === '/greet' && method === 'POST') {
    const body = await readJson(req);
    return send(res, 200, { greeting: `Hello, ${body.name ?? ''}` });
  }

  if (path === '/image.png' && method === 'GET') {
    await sleep(1500);
    res.writeHead(200, { 'content-type': 'image/png', 'cache-control': 'no-store', 'access-control-allow-origin': '*' });
    return res.end(PNG_IMAGE);
  }

  send(res, 404, { error: `no route: ${method} ${path}` });
}

// 客户端在请求途中断开（例：测试结束 app 进程）时，读取请求体会抛出 `aborted`。
// 只记录日志，不让整个 mock server 退出（2026-11-18 Appium S23 中实测导致进程崩溃）。
const server = http.createServer((req, res) => {
  handle(req, res).catch((err) => {
    console.error(`[mock-server] ${req.method} ${req.url}: ${err?.code ?? err}`);
    if (!res.headersSent && !res.destroyed) res.destroy();
  });
});

// ---------- WebSocket（A14）：每 500 ms 推送一条消息 ----------

const wss = new WebSocketServer({ server, path: '/ws' });
wss.on('connection', (ws) => {
  let n = 0;
  const timer = setInterval(() => {
    n += 1;
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type: 'tick', n }));
  }, 500);
  ws.on('close', () => clearInterval(timer));
});

server.listen(PORT, () => {
  console.log(`[mock-server] listening on http://localhost:${PORT}`);
});
