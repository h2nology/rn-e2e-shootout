// mock server：harness 启动并持有（每个 harness 进程一个），每次运行前设置施压条件、清除计时标记。
import path from 'node:path';
import { MOCK_URL, ROOT } from './config.mjs';
import { spawnDetached, waitFor } from './sh.mjs';

let child = null;

async function health() {
  const r = await fetch(`${MOCK_URL}/health`, { signal: AbortSignal.timeout(2000) });
  return r.ok;
}

export async function startMock(logFile) {
  if (await health().catch(() => false)) {
    // 已有进程占用 4000：确认它支持计时标记（旧代码的 mock server 不支持）
    const r = await fetch(`${MOCK_URL}/harness/marks`).catch(() => null);
    if (!r?.ok) throw new Error('port 4000 is used by a mock server without /harness/marks; stop it first');
    return;
  }
  child = spawnDetached(process.execPath, [path.join(ROOT, 'mock-server', 'src', 'server.ts')], { logFile });
  await waitFor(() => health(), { timeoutMs: 20_000, intervalMs: 300, what: 'mock server' });
}

export function stopMock() {
  if (child) {
    try { process.kill(child.pid, 'SIGTERM'); } catch {}
    child = null;
  }
}

/** 施压条件（METHODOLOGY 8.4）：mock server 的 /config 下发；PUT 同时 reset 数据。 */
export async function configure(stress, seed) {
  const r = await fetch(`${MOCK_URL}/config`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ stress, seed }),
  });
  if (!r.ok) throw new Error(`PUT /config: ${r.status} ${await r.text()}`);
  return r.json();
}

export async function clearMarks() {
  await fetch(`${MOCK_URL}/harness/marks`, { method: 'DELETE' });
}

/** [{ t, event, scenario }] */
export async function getMarks() {
  const r = await fetch(`${MOCK_URL}/harness/marks`);
  return r.json();
}
