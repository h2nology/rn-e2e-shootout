#!/usr/bin/env node
// 统一执行器（计划书第 5 节）。用法见 harness/README.md。
//   harness run      --tool <t> --platform <p> --runs <N> [--variant final|diagnostic] [--stress <profile>] [--warmup <K>] [--session <name>]
//   harness plan     --tools a,b --platforms ios,android --variants final --stress none --runs <N> [--warmup 3] --seed <S> --session <name>
//   harness execute  --session <name> [--limit <K>]
//   harness build    --tool <t> --platform <p> [--repeat <K>]
//   harness summarize [--sessions a,b] [--out results/summary.json]
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { PLATFORMS, RESULTS_RAW, STRESS_PROFILES, TOOLS, VARIANTS } from './lib/config.mjs';
import * as host from './lib/host.mjs';
import * as mock from './lib/mock.mjs';
import { runOne } from './lib/run-one.mjs';
import { createPlan, loadPlan, loadResults, makeupEntries, pending, savePlan, sessionDir } from './lib/session.mjs';
import { runLogged } from './lib/sh.mjs';
import { TOOL_ADAPTERS } from './lib/tools.mjs';
import { summarize } from './summarize.mjs';
import { writeCharts } from './charts.mjs';

const [cmd, ...rest] = process.argv.slice(2);
const { values: o } = parseArgs({
  args: rest,
  options: {
    tool: { type: 'string' },
    tools: { type: 'string' },
    platform: { type: 'string' },
    platforms: { type: 'string' },
    variant: { type: 'string', default: 'final' },
    variants: { type: 'string', default: 'final' },
    stress: { type: 'string', default: 'none' },
    runs: { type: 'string' },
    warmup: { type: 'string' },
    seed: { type: 'string' },
    session: { type: 'string' },
    sessions: { type: 'string' },
    limit: { type: 'string' },
    repeat: { type: 'string', default: '1' },
    out: { type: 'string' },
    'stress-seed': { type: 'string', default: '1' },
  },
});

const stamp = () => new Date().toISOString().replace(/[-:]/g, '').replace(/\..*/, '').replace('T', '-');
const list = (s) => (s ?? '').split(',').map((x) => x.trim()).filter(Boolean);
function check(values, allowed, what) {
  for (const v of values) if (!allowed.includes(v)) throw new Error(`unknown ${what}: ${v} (${allowed.join(', ')})`);
  if (values.length === 0) throw new Error(`--${what} is required`);
  return values;
}

async function execute(name, limit) {
  const plan = loadPlan(name);
  const dir = sessionDir(name);
  const logFile = path.join(dir, 'harness.log');
  const log = (m) => {
    const line = `${new Date().toISOString()} ${m}`;
    console.log(line);
    fs.appendFileSync(logFile, line + '\n');
  };
  host.keepAwake();
  const power = await host.powerSource();
  if (power !== 'AC Power') throw new Error(`host is on ${power}; connect power (METHODOLOGY 6.4)`);
  const spotlight = await host.spotlightIndexing();
  if (spotlight !== 'disabled') log(`warning: Spotlight indexing is ${spotlight} (METHODOLOGY 6.4: mdutil -i off)`);
  const hostInfo = await host.hostInfo();
  fs.writeFileSync(path.join(dir, 'host.json'), JSON.stringify({ ...hostInfo, power, spotlight, checkedAt: new Date().toISOString() }, null, 2) + '\n');
  await mock.startMock(path.join(dir, 'mock-server.log'));
  let failures = 0;
  let todo = pending(plan).slice(0, limit ? Number(limit) : undefined);
  log(`session ${name}: ${todo.length} of ${plan.entries.length} runs to do`);
  try {
    // 计划内的运行做完后，无效运行按组合补跑到有效 N = runs（METHODOLOGY 6.2 v18）；--limit 时不补跑
    for (let round = 0; todo.length > 0 && round < 10; round++) {
      for (const e of todo) {
        try {
          await runOne({ ...e, file: path.join(dir, e.file) }, { sessionDir: dir, hostInfo, log });
        } catch (err) {
          // 环境错误（开机超时等）：记录后停止，不写结果，可修复后用 execute 继续
          log(`ERROR in ${e.file}: ${err.stack ?? err}`);
          failures++;
          throw err;
        }
      }
      if (limit) break;
      const add = makeupEntries(plan, loadResults(plan));
      if (add.length === 0) break;
      plan.entries.push(...add);
      savePlan(plan);
      todo = add;
      log(`session ${name}: ${add.length} make-up runs appended for invalid runs (round ${add[0].makeupRound})`);
    }
  } finally {
    mock.stopMock();
  }
  return failures;
}

async function main() {
  switch (cmd) {
    case 'run': {
      const tool = check([o.tool], TOOLS, 'tool')[0];
      const platform = check([o.platform], PLATFORMS, 'platform')[0];
      const variant = check([o.variant], VARIANTS, 'variant')[0];
      const stress = check([o.stress], STRESS_PROFILES, 'stress')[0];
      const name = o.session ?? `${stamp()}-${tool}-${platform}-${variant}-${stress}`;
      createPlan({
        name,
        combos: [{ tool, platform, variant, stress }],
        runs: Number(o.runs ?? 1),
        warmup: Number(o.warmup ?? 0),
        seed: 0,
        shuffle: false,
        stressSeed: Number(o['stress-seed']),
      });
      await execute(name);
      console.log(`results: ${sessionDir(name)}`);
      break;
    }
    case 'plan': {
      const tools = check(list(o.tools), TOOLS, 'tools');
      const platforms = check(list(o.platforms), PLATFORMS, 'platforms');
      const variants = check(list(o.variants), VARIANTS, 'variants');
      const stresses = check(list(o.stress), STRESS_PROFILES, 'stress');
      if (!o.seed) throw new Error('--seed is required (METHODOLOGY 6.3)');
      const combos = [];
      for (const tool of tools) for (const platform of platforms) for (const variant of variants) for (const stress of stresses) {
        if (stress === 'slow-cpu' && platform !== 'android') continue;
        combos.push({ tool, platform, variant, stress });
      }
      const name = o.session ?? `${stamp()}-plan`;
      const plan = createPlan({ name, combos, runs: Number(o.runs ?? 1), warmup: Number(o.warmup ?? 3), seed: Number(o.seed), shuffle: true, stressSeed: Number(o['stress-seed']) });
      console.log(`${plan.entries.length} runs planned in ${sessionDir(name)}/run-order.json`);
      break;
    }
    case 'execute': {
      if (!o.session) throw new Error('--session is required');
      await execute(o.session, o.limit);
      break;
    }
    case 'build': {
      const tool = check([o.tool], TOOLS, 'tool')[0];
      const platform = check([o.platform], PLATFORMS, 'platform')[0];
      const a = TOOL_ADAPTERS[tool];
      const dir = path.join(RESULTS_RAW, 'builds');
      fs.mkdirSync(dir, { recursive: true });
      for (let i = 1; i <= Number(o.repeat); i++) {
        const b = a.build(platform);
        const base = `${stamp()}-${tool}-${platform}`;
        const r = await runLogged(b.cmd, b.args, { cwd: a.dir, env: b.env, logFile: path.join(dir, `${base}.log`), timeoutMs: 120 * 60_000 });
        const rec = { tool, toolVersion: await a.version(), platform, startedAt: new Date(r.startedAt).toISOString(), buildMs: r.endedAt - r.startedAt, exitCode: r.code };
        fs.writeFileSync(path.join(dir, `${base}.json`), JSON.stringify(rec, null, 2) + '\n');
        console.log(`${tool} ${platform} build ${i}: exit ${r.code}, ${rec.buildMs} ms`);
        if (r.code !== 0) process.exitCode = 1;
      }
      break;
    }
    case 'summarize': {
      const out = o.out ?? path.join(path.dirname(RESULTS_RAW), 'summary.json');
      const sessions = list(o.sessions);
      const s = summarize({ sessions: sessions.length ? sessions : null, out });
      console.log(`${out}: ${s.groups.length} groups from ${s.runCount} runs`);
      const charts = writeCharts(s, path.join(path.dirname(out), 'charts'));
      console.log(`charts: ${charts.join(', ') || '(none)'}`);
      break;
    }
    default:
      console.error(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 8).join('\n'));
      process.exitCode = 2;
  }
}

main().catch((e) => {
  console.error(e.stack ?? e);
  process.exitCode = 1;
});
