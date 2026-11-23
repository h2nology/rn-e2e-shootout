// 宿主机的检查与环境控制（METHODOLOGY 6.4）：电源、负载、Spotlight、防睡眠、睡眠记录、主机信息。
import os from 'node:os';
import { run, sleep, spawnDetached } from './sh.mjs';
import { LIMITS } from './config.mjs';

export async function powerSource() {
  const out = await run('pmset', ['-g', 'batt'], { allowFail: true });
  const m = out.match(/Now drawing from '([^']+)'/);
  return m ? m[1] : 'unknown';
}

export async function spotlightIndexing() {
  const out = await run('mdutil', ['-s', '/'], { allowFail: true });
  return /Indexing enabled/i.test(out) ? 'enabled' : /disabled/i.test(out) ? 'disabled' : 'unknown';
}

export async function loadAvg() {
  const out = await run('sysctl', ['-n', 'vm.loadavg']);
  const [one, five, fifteen] = out.replace(/[{}]/g, '').trim().split(/\s+/).map(Number);
  return { one, five, fifteen };
}

/** 等 1 分钟 load average 降到阈值以下。返回 { waitedMs, load }；超过上限抛出。 */
export async function waitForLoad(log) {
  const start = Date.now();
  for (;;) {
    const load = await loadAvg();
    if (load.one < LIMITS.loadThreshold) return { waitedMs: Date.now() - start, load };
    if (Date.now() - start > LIMITS.loadMaxWaitMs) {
      throw new Error(`load average stayed at or above ${LIMITS.loadThreshold} for ${LIMITS.loadMaxWaitMs / 60000} min (now ${load.one})`);
    }
    log(`load ${load.one} ≥ ${LIMITS.loadThreshold}, waiting`);
    await sleep(LIMITS.loadPollMs);
  }
}

/** 本进程存活期间防止睡眠（caffeinate -dimsu -w <pid>）。 */
export function keepAwake() {
  spawnDetached('caffeinate', ['-dimsu', '-w', String(process.pid)]);
}

/** since（Date）之后 pmset 记录的睡眠 / 唤醒事件。 */
export async function sleepEventsSince(since) {
  const out = await run('pmset', ['-g', 'log'], { allowFail: true, timeoutMs: 60_000 });
  const s = fmt(since);
  return out
    .split('\n')
    .filter((l) => /^\d{4}-\d{2}-\d{2} /.test(l) && l.slice(0, 19) >= s)
    .filter((l) => / (Sleep|DarkWake|Wake) +/.test(l) && !/Assertions/.test(l))
    .map((l) => l.trim());
}

function fmt(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export async function hostInfo() {
  const [cpu, mem, osv, build, xcode] = await Promise.all([
    run('sysctl', ['-n', 'machdep.cpu.brand_string'], { allowFail: true }),
    run('sysctl', ['-n', 'hw.memsize'], { allowFail: true }),
    run('sw_vers', ['-productVersion'], { allowFail: true }),
    run('sw_vers', ['-buildVersion'], { allowFail: true }),
    run('xcodebuild', ['-version'], { allowFail: true }),
  ]);
  return {
    hostname: os.hostname(),
    cpu: cpu.trim(),
    cores: os.cpus().length,
    memoryGB: Math.round(Number(mem) / 1024 ** 3),
    macos: `${osv.trim()} (${build.trim()})`,
    xcode: xcode.trim().replace(/\n/g, ' '),
    node: process.version,
  };
}
