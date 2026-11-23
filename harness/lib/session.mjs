// 运行计划（METHODOLOGY 6.2 / 6.3）：预热 3 次（不计入统计）+ 正式运行；正式运行把（工具 × 平台 × 版本 × 施压 × 序号）
// 用固定种子打乱，写进 run-order.json。执行时跳过已有结果的条目，可中断后继续。
import fs from 'node:fs';
import path from 'node:path';
import { RESULTS_RAW } from './config.mjs';

/** mulberry32：固定种子的伪随机数 */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(list, seed) {
  const r = rng(seed);
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function sessionDir(name) {
  return path.join(RESULTS_RAW, name);
}

/**
 * combos: [{ tool, platform, variant, stress }]；runs / warmup：每个组合的次数。
 * shuffle=false 时按组合依次执行（单个组合的 harness run）。
 */
export function createPlan({ name, combos, runs, warmup, seed, shuffle: doShuffle, stressSeed = 1 }) {
  const dir = sessionDir(name);
  if (fs.existsSync(path.join(dir, 'run-order.json'))) throw new Error(`session ${name} already has a run-order.json`);
  fs.mkdirSync(dir, { recursive: true });
  const warm = [];
  const real = [];
  for (const c of combos) {
    for (let i = 1; i <= warmup; i++) warm.push({ ...c, runIndex: i, warmup: true });
    for (let i = 1; i <= runs; i++) real.push({ ...c, runIndex: i, warmup: false });
  }
  const ordered = doShuffle ? [...shuffle(warm, seed), ...shuffle(real, seed + 1)] : [...warm, ...real];
  const entries = ordered.map((e, i) => ({
    seq: i + 1,
    ...e,
    seed: stressSeed,
    file: `${String(i + 1).padStart(4, '0')}-${e.tool}-${e.platform}-${e.variant}-${e.stress}-${e.warmup ? 'w' : 'r'}${e.runIndex}.json`,
  }));
  const plan = { name, createdAt: new Date().toISOString(), shuffleSeed: doShuffle ? seed : null, runs, warmup, combos, entries };
  fs.writeFileSync(path.join(dir, 'run-order.json'), JSON.stringify(plan, null, 2) + '\n');
  return plan;
}

export function loadPlan(name) {
  const dir = sessionDir(name);
  return JSON.parse(fs.readFileSync(path.join(dir, 'run-order.json'), 'utf8'));
}

export function pending(plan) {
  const dir = sessionDir(plan.name);
  return plan.entries.filter((e) => !fs.existsSync(path.join(dir, e.file)));
}
