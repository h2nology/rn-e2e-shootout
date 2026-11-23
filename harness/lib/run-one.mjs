// 一次套件运行（计划书第 5 节、METHODOLOGY 6 / 7）：
// 等宿主机负载降下来 → 重启模拟器并设置环境 → 设置施压条件、清除计时标记 → 卸载后安装 app →
// 运行工具（30 分钟上限）→ 读 JUnit 与计时标记 → 写结果 JSON。
import fs from 'node:fs';
import path from 'node:path';
import { LIMITS, ROOT, SCENARIOS } from './config.mjs';
import * as device from './device.mjs';
import * as host from './host.mjs';
import * as mock from './mock.mjs';
import { parseJUnit, scenarioId } from './junit.mjs';
import { runLogged } from './sh.mjs';
import { TOOL_ADAPTERS, binaryPaths } from './tools.mjs';

export function methodologyVersion() {
  const s = fs.readFileSync(path.join(ROOT, 'METHODOLOGY.md'), 'utf8');
  return s.match(/方法版本：\*\*(v\d+)\*\*/)?.[1] ?? 'unknown';
}

export function expoSdk() {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'app', 'package.json'), 'utf8'));
  return Number(String(pkg.dependencies.expo).replace(/^[^\d]*/, '').split('.')[0]);
}

/**
 * entry: { tool, platform, variant, stress, seed, runIndex, warmup, file }
 * ctx: { sessionDir, hostInfo, log }
 */
export async function runOne(entry, ctx) {
  const { tool, platform, variant, stress } = entry;
  const a = TOOL_ADAPTERS[tool];
  const log = (m) => ctx.log(`[${tool}/${platform}/${variant}/${stress} #${entry.runIndex}${entry.warmup ? ' warmup' : ''}] ${m}`);
  const base = path.basename(entry.file, '.json');
  const logDir = path.join(ctx.sessionDir, 'logs');
  fs.mkdirSync(logDir, { recursive: true });
  const startedAt = new Date();

  const bins = binaryPaths(tool, platform);
  for (const b of bins) if (!fs.existsSync(b)) throw new Error(`missing build: ${b} (harness build --tool ${tool} --platform ${platform})`);
  if (stress === 'slow-cpu' && platform !== 'android') throw new Error('slow-cpu applies to Android only (METHODOLOGY 8.4)');

  // 1. 宿主机负载
  const loadWait = await host.waitForLoad(log);

  // 2. 模拟器
  const dev =
    platform === 'ios'
      ? await device.prepareIos(log)
      : await device.prepareAndroid(log, { cores: stress === 'slow-cpu' ? 2 : undefined, logFile: path.join(logDir, `${base}.emulator.log`) });
  if (stress === 'slow-cpu') await device.startCpuHog();
  // 模拟器开机本身会抬高负载（smoke：重启前 < 8，开始时 37）→ 开机后再等一次
  const loadAfterBoot = await host.waitForLoad(log);

  // 3. 施压条件与计时标记
  const mockConfig = await mock.configure(stress, entry.seed ?? 1);
  await mock.clearMarks();

  // 4. 安装
  const installMs = platform === 'ios' ? await device.installIos(dev.udid, bins[0]) : await device.installAndroid(bins);

  // 5. 运行工具
  const t = a.test(platform, variant, dev);
  const junitDir = path.join(a.dir, a.junitDir(platform, variant));
  fs.mkdirSync(junitDir, { recursive: true });
  const toolLog = path.join(logDir, `${base}.log`);
  const loadAtStart = await host.loadAvg();
  log(`running ${t.cmd} ${t.args.join(' ')} (load ${loadAtStart.one})`);
  // 运行期间每 30 s 采样一次 1 分钟 load average（宿主机负载对耗时影响大，findings.md S6）
  const loadSamples = [];
  const sampler = setInterval(() => host.loadAvg().then((l) => loadSamples.push(l.one), () => {}), 30_000);
  let res;
  try {
    res = await runLogged(t.cmd, t.args, { cwd: a.dir, env: t.env, logFile: toolLog, timeoutMs: LIMITS.suiteTimeoutMs });
  } finally {
    clearInterval(sampler);
  }

  // 6. 收集
  const junitFiles = fs
    .readdirSync(junitDir)
    .filter((f) => f.endsWith('.xml'))
    .map((f) => path.join(junitDir, f))
    .filter((f) => fs.statSync(f).mtimeMs >= res.startedAt - 1000);
  const junitCopyDir = path.join(ctx.sessionDir, 'junit', base);
  fs.mkdirSync(junitCopyDir, { recursive: true });
  const cases = [];
  for (const f of junitFiles) {
    fs.copyFileSync(f, path.join(junitCopyDir, path.basename(f)));
    cases.push(...parseJUnit(f));
  }
  const marks = await mock.getMarks();
  fs.writeFileSync(path.join(junitCopyDir, 'marks.json'), JSON.stringify(marks, null, 1));
  const sleepEvents = await host.sleepEventsSince(startedAt);

  const scenarios = composeScenarios(cases, marks, res.timedOut);
  const starts = scenarios.map((s) => s._start).filter(Number.isFinite);
  const ends = scenarios.map((s) => s._end).filter(Number.isFinite);
  const firstStart = starts.length ? Math.min(...starts) : null;
  const lastEnd = ends.length ? Math.max(...ends) : null;
  const launchMs = firstStart !== null ? firstStart - res.startedAt : null;
  const suiteMs = firstStart !== null && lastEnd !== null ? lastEnd - firstStart : null;

  const result = {
    tool,
    toolVersion: await a.version(),
    methodologyVersion: methodologyVersion(),
    variant,
    platform,
    device: dev.device,
    host: `${ctx.hostInfo.cpu}, ${ctx.hostInfo.cores} cores, ${ctx.hostInfo.memoryGB} GB, macOS ${ctx.hostInfo.macos}`,
    expoSdk: expoSdk(),
    runIndex: entry.runIndex,
    warmup: !!entry.warmup,
    stress,
    seed: entry.seed ?? 1,
    buildMs: null, // 构建单独计时（harness build，METHODOLOGY 7）
    installMs,
    launchMs,
    suiteMs,
    totalMs: launchMs !== null && suiteMs !== null ? installMs + launchMs + suiteMs : null,
    toolWallMs: res.endedAt - res.startedAt,
    startedAt: startedAt.toISOString(),
    exitCode: res.code,
    timedOut: res.timedOut,
    invalid: sleepEvents.length > 0,
    invalidReason: sleepEvents.length > 0 ? 'host sleep events during the run' : null,
    sleepEvents,
    environment: {
      loadBefore: loadWait.load,
      loadWaitedMs: loadWait.waitedMs,
      loadAfterBoot: loadAfterBoot.load,
      loadAfterBootWaitedMs: loadAfterBoot.waitedMs,
      loadAtStart,
      loadDuring: loadSamples.length
        ? { samples: loadSamples.length, median: median(loadSamples), max: Math.max(...loadSamples), values: loadSamples }
        : null,
      deviceRebootMs: dev.rebootMs,
      device: dev.env,
      emulatorArgs: dev.emulatorArgs ?? null,
      mockConfig,
    },
    scenarios: scenarios.map(({ _start, _end, ...s }) => s),
    files: {
      log: path.relative(ctx.sessionDir, toolLog),
      junit: path.relative(ctx.sessionDir, junitCopyDir),
    },
  };
  fs.writeFileSync(entry.file, JSON.stringify(result, null, 2) + '\n');
  const failed = result.scenarios.filter((s) => !['passed', 'skipped'].includes(s.status));
  log(
    `done: ${result.scenarios.filter((s) => s.status === 'passed').length} passed, ${failed.length} failed` +
      `${failed.length ? ` (${failed.map((s) => `${s.id}:${s.status}`).join(', ')})` : ''}, suite ${suiteMs} ms, launch ${launchMs} ms, install ${installMs} ms` +
      `${result.environment.loadDuring ? `, load during median ${result.environment.loadDuring.median} / max ${result.environment.loadDuring.max}` : ''}` +
      `${result.invalid ? ' — INVALID (sleep events)' : ''}`,
  );
  return result;
}

function median(xs) {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/**
 * JUnit 的结果 + 计时标记 → 每个场景一条。
 * durationMs = 场景结束 − 重置结束；resetMs = 重置结束 − 场景开始（METHODOLOGY 7）。
 * 同一场景内多次重置（S10 等）只取第一次的重置结束。
 */
export function composeScenarios(cases, marks, timedOut) {
  const byId = new Map();
  for (const c of cases) {
    const id = scenarioId(c.name, c.suite, c.classname, c.file);
    if (!id) continue;
    const prev = byId.get(id);
    if (!prev) byId.set(id, { ...c });
    else {
      // 同一场景有多个 testcase：任一失败即失败
      if (c.status === 'failed') Object.assign(prev, { status: 'failed', error: prev.error ?? c.error });
      else if (prev.status === 'skipped' && c.status === 'passed') prev.status = 'passed';
      prev.timeMs += c.timeMs;
    }
  }
  const timing = new Map();
  for (const m of marks) {
    const id = scenarioId(m.scenario);
    if (!id) continue;
    const t = timing.get(id) ?? {};
    if (m.event === 'scenario-start' && t.start === undefined) t.start = m.t;
    if (m.event === 'reset-end' && t.resetEnd === undefined && t.start !== undefined && m.t >= t.start) t.resetEnd = m.t;
    if (m.event === 'scenario-end') t.end = m.t;
    timing.set(id, t);
  }
  return SCENARIOS.map((id) => {
    const c = byId.get(id);
    const t = timing.get(id) ?? {};
    const status = c ? c.status : timedOut ? 'timeout' : t.start !== undefined ? 'failed' : 'missing';
    const hasTiming = t.resetEnd !== undefined && t.end !== undefined;
    return {
      id,
      status,
      durationMs: hasTiming ? t.end - t.resetEnd : null,
      resetMs: t.start !== undefined && t.resetEnd !== undefined ? t.resetEnd - t.start : null,
      junitTimeMs: c ? c.timeMs : null,
      error: c?.error ?? (status === 'missing' ? 'no result in JUnit' : status === 'timeout' ? 'suite timeout (METHODOLOGY 6.5)' : null),
      retries: 0,
      _start: t.start,
      _end: t.end,
    };
  });
}
