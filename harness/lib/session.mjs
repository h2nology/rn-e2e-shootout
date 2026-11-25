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

/**
 * 补跑（METHODOLOGY 6.2 v18）：计划内的运行全部完成后，各组合的有效正式运行（非预热、非无效）不足 runs 次时，
 * 按不足的次数追加条目（序号接着编，同样用固定种子打乱后交错执行），补跑本身无效时再追加。
 * results：已有结果 [{ tool, platform, variant, stress, warmup, invalid }]。返回追加的条目（不写文件）。
 */
export function makeupEntries(plan, results) {
  const key = (e) => `${e.tool}/${e.platform}/${e.variant}/${e.stress}`;
  const valid = new Map();
  for (const r of results) if (!r.warmup && !r.invalid) valid.set(key(r), (valid.get(key(r)) ?? 0) + 1);
  const maxIndex = new Map();
  for (const e of [...plan.entries, ...(plan.droppedEntries ?? [])]) if (!e.warmup) maxIndex.set(key(e), Math.max(maxIndex.get(key(e)) ?? 0, e.runIndex));
  const add = [];
  for (const c of plan.combos) {
    const short = plan.runs - (valid.get(key(c)) ?? 0);
    for (let i = 1; i <= short; i++) add.push({ ...c, runIndex: (maxIndex.get(key(c)) ?? 0) + i, warmup: false, makeup: true });
  }
  if (add.length === 0) return [];
  const round = Math.max(0, ...plan.entries.map((e) => e.makeupRound ?? 0)) + 1;
  const ordered = plan.shuffleSeed !== null ? shuffle(add, plan.shuffleSeed + 1 + round) : add;
  const seed = plan.entries[0]?.seed ?? 1;
  return ordered.map((e, i) => {
    const seq = plan.entries.length + i + 1;
    return { seq, ...e, makeupRound: round, seed, file: `${String(seq).padStart(4, '0')}-${e.tool}-${e.platform}-${e.variant}-${e.stress}-r${e.runIndex}.json` };
  });
}

/**
 * 缩减 N（METHODOLOGY 6.2 v19）：已完成的条目全部保留；未完成的正式运行条目按计划顺序，每个组合只保留
 * （runs − 已有有效运行）条，其余移到 plan.droppedEntries（不删除，留作记录）。results 同 makeupEntries；todo：未完成的条目（默认看结果文件是否存在）。
 * 就地修改 plan（runs 改为新值），返回移走的条目。
 */
export function trimPlan(plan, results, runs, reason, todo = pending(plan)) {
  const key = (e) => `${e.tool}/${e.platform}/${e.variant}/${e.stress}`;
  const notDone = new Set(todo.map((e) => e.file));
  const isDone = (e) => !notDone.has(e.file);
  const left = new Map();
  for (const c of plan.combos) left.set(key(c), runs);
  for (const r of results) if (!r.warmup && !r.invalid) left.set(key(r), (left.get(key(r)) ?? 0) - 1);
  const kept = [];
  const dropped = [];
  for (const e of plan.entries) {
    if (isDone(e) || e.warmup) { kept.push(e); continue; }
    if ((left.get(key(e)) ?? 0) > 0) { left.set(key(e), left.get(key(e)) - 1); kept.push(e); }
    else dropped.push(e);
  }
  plan.entries = kept;
  plan.droppedEntries = [...(plan.droppedEntries ?? []), ...dropped.map((e) => ({ ...e, droppedAt: new Date().toISOString(), droppedReason: reason }))];
  plan.runsHistory = [...(plan.runsHistory ?? []), { from: plan.runs, to: runs, at: new Date().toISOString(), reason }];
  plan.runs = runs;
  return dropped;
}

export function savePlan(plan) {
  fs.writeFileSync(path.join(sessionDir(plan.name), 'run-order.json'), JSON.stringify(plan, null, 2) + '\n');
}

export function loadResults(plan) {
  const dir = sessionDir(plan.name);
  return plan.entries.filter((e) => fs.existsSync(path.join(dir, e.file))).map((e) => JSON.parse(fs.readFileSync(path.join(dir, e.file), 'utf8')));
}
