// 汇总（计划书第 5 节、METHODOLOGY 8 / 9）：results/raw 下的结果 JSON → summary.json（+ 图表）。
// - 预热（warmup）与无效运行（运行中宿主机睡眠）不计入。
// - 耗时：median / p90 / min / max，只统计通过的场景；整套耗时只统计全部场景通过的运行；
//   各工具比较用共同场景集的整套耗时（METHODOLOGY 9 v15）。
// - 失败率：比例 + 95% Wilson 区间，整套与按场景两个粒度；skipped 不计入分母；N 次全部失败的场景标为“未通过”（不是 flake）。
import fs from 'node:fs';
import path from 'node:path';
import { COMMON_EXCLUDED, RESULTS_RAW, SCENARIOS } from './lib/config.mjs';

/** 95% Wilson 区间（METHODOLOGY 8.2） */
export function wilson(k, n, z = 1.96) {
  if (n === 0) return { rate: null, low: null, high: null };
  const p = k / n;
  const z2 = z * z;
  const denom = 1 + z2 / n;
  const center = (p + z2 / (2 * n)) / denom;
  const half = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / denom;
  return { rate: p, low: Math.max(0, center - half), high: Math.min(1, center + half) };
}

/** 分位数：线性插值（R type 7），p90 = quantile(0.9) */
export function quantile(sorted, q) {
  if (sorted.length === 0) return null;
  const h = (sorted.length - 1) * q;
  const lo = Math.floor(h);
  const hi = Math.ceil(h);
  return Math.round(sorted[lo] + (sorted[hi] - sorted[lo]) * (h - lo));
}

export function stats(values) {
  const v = values.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (v.length === 0) return { n: 0, median: null, p90: null, min: null, max: null };
  return { n: v.length, median: quantile(v, 0.5), p90: quantile(v, 0.9), min: v[0], max: v[v.length - 1] };
}

/**
 * 共同场景集的整套耗时（METHODOLOGY 9，v15）：共同场景集中的场景全部通过时，取这些场景各自“时段”之和；
 * 一个场景的时段 = 上一个有结束标记的场景结束（第一个场景：开始）→ 本场景结束，所以含场景之间 runner 的开销，
 * 全部场景的时段之和等于 suiteMs。不满足条件时返回 null。旧结果没有 endOffsetMs 时退回 resetMs + durationMs。
 */
export function commonSuiteMs(run) {
  const excluded = new Set(COMMON_EXCLUDED[run.platform] ?? []);
  const common = run.scenarios.filter((s) => !excluded.has(s.id));
  if (common.length === 0 || common.some((s) => !OK.has(s.status))) return null;
  if (run.scenarios.every((s) => s.endOffsetMs === undefined)) {
    const parts = common.map((s) => (s.resetMs ?? NaN) + (s.durationMs ?? NaN));
    return parts.every(Number.isFinite) ? parts.reduce((a, b) => a + b, 0) : null;
  }
  const ended = run.scenarios.filter((s) => Number.isFinite(s.endOffsetMs)).sort((a, b) => a.endOffsetMs - b.endOffsetMs);
  let prev = 0;
  let sum = 0;
  for (const s of ended) {
    if (!excluded.has(s.id)) sum += s.endOffsetMs - prev;
    prev = s.endOffsetMs;
  }
  return common.every((s) => Number.isFinite(s.endOffsetMs)) ? sum : null;
}

function loadRuns(sessions) {
  const dirs = sessions
    ? sessions.map((s) => path.join(RESULTS_RAW, s))
    : fs.readdirSync(RESULTS_RAW, { withFileTypes: true }).filter((d) => d.isDirectory() && d.name !== 'builds').map((d) => path.join(RESULTS_RAW, d.name));
  const runs = [];
  for (const dir of dirs) {
    if (!fs.existsSync(path.join(dir, 'run-order.json'))) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!/^\d{4}-.*\.json$/.test(f)) continue;
      const r = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      runs.push({ ...r, _session: path.basename(dir), _file: f });
    }
  }
  return runs;
}

const OK = new Set(['passed']);
const IGNORED = new Set(['skipped']);

export function summarize({ sessions = null, out } = {}) {
  const all = loadRuns(sessions);
  const counted = all.filter((r) => !r.warmup && !r.invalid);
  const groups = new Map();
  for (const r of counted) {
    const key = [r.tool, r.platform, r.variant, r.stress].join('|');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }
  const result = [];
  for (const [key, runs] of [...groups].sort()) {
    const [tool, platform, variant, stress] = key.split('|');
    const versions = [...new Set(runs.map((r) => r.toolVersion))];
    const methodology = [...new Set(runs.map((r) => r.methodologyVersion))];
    const suiteFailures = runs.filter((r) => r.scenarios.some((s) => !OK.has(s.status) && !IGNORED.has(s.status))).length;
    const green = runs.filter((r) => r.scenarios.every((s) => OK.has(s.status) || IGNORED.has(s.status)));
    const scenarios = SCENARIOS.map((id) => {
      const rows = runs.map((r) => r.scenarios.find((s) => s.id === id)).filter((s) => s && !IGNORED.has(s.status));
      const k = rows.filter((s) => !OK.has(s.status)).length;
      const n = rows.length;
      const errors = {};
      for (const s of rows) if (!OK.has(s.status)) {
        const head = String(s.error ?? s.status).split('\n')[0].slice(0, 200);
        errors[head] = (errors[head] ?? 0) + 1;
      }
      return {
        id,
        n,
        failures: k,
        failureRate: wilson(k, n),
        // N 次全部失败：“未通过”，不算 flake（METHODOLOGY 8.1）
        neverPassed: n > 0 && k === n,
        skipped: runs.length - n,
        durationMs: stats(rows.filter((s) => OK.has(s.status)).map((s) => s.durationMs)),
        resetMs: stats(rows.map((s) => s.resetMs)),
        errors,
      };
    });
    result.push({
      tool,
      platform,
      variant,
      stress,
      toolVersions: versions,
      methodologyVersions: methodology,
      runs: runs.length,
      suite: {
        failures: suiteFailures,
        failureRate: wilson(suiteFailures, runs.length),
        // 全绿运行的整套耗时：不含安装与启动 / 含安装与启动（METHODOLOGY 7）
        // 共同场景集的整套耗时（各工具比较用，METHODOLOGY 9 v15）
        commonScenarios: SCENARIOS.filter((id) => !(COMMON_EXCLUDED[platform] ?? []).includes(id)),
        commonSuiteMs: stats(runs.map(commonSuiteMs).filter((v) => v !== null)),
        commonGreenRuns: runs.filter((r) => commonSuiteMs(r) !== null).length,
        suiteMs: stats(green.map((r) => r.suiteMs)),
        totalMs: stats(green.map((r) => r.totalMs)),
        installMs: stats(runs.map((r) => r.installMs)),
        launchMs: stats(runs.map((r) => r.launchMs)),
        greenRuns: green.length,
      },
      scenarios,
    });
  }
  const summary = {
    generatedAt: new Date().toISOString(),
    sessions: [...new Set(all.map((r) => r._session))].sort(),
    runCount: counted.length,
    excluded: { warmup: all.filter((r) => r.warmup).length, invalid: all.filter((r) => !r.warmup && r.invalid).length },
    definitions: {
      percentile: 'linear interpolation (R type 7)',
      failureRateCI: '95% Wilson score interval',
      durations: 'passed scenarios only; suiteMs from all-green runs only; commonSuiteMs over the common scenario set (COMMON_EXCLUDED per platform) from runs where those all passed',
    },
    groups: result,
  };
  if (out) {
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(summary, null, 2) + '\n');
  }
  return summary;
}
