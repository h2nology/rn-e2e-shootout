import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { wilson, quantile, stats } from '../summarize.mjs';
import { scenarioId, parseJUnit } from '../lib/junit.mjs';
import { composeScenarios } from '../lib/run-one.mjs';
import { ROOT } from '../lib/config.mjs';

test('wilson matches METHODOLOGY 8.2', () => {
  // 0 / 100：[0, 0.0370]；5 / 100：[0.0215, 0.1118]
  const a = wilson(0, 100);
  assert.equal(a.rate, 0);
  assert.equal(a.low, 0);
  assert.ok(Math.abs(a.high - 0.037) < 0.0005);
  const b = wilson(5, 100);
  assert.ok(Math.abs(b.low - 0.0215) < 0.0005 && Math.abs(b.high - 0.1118) < 0.0005);
  assert.equal(wilson(0, 0).rate, null);
});

test('quantile / stats (type 7)', () => {
  assert.equal(quantile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0.9), 9);
  assert.equal(quantile([10, 20], 0.5), 15);
  assert.deepEqual(stats([3, null, 1, 2]), { n: 3, median: 2, p90: 3, min: 1, max: 3 });
});

test('scenarioId normalizes every tool\'s naming', () => {
  assert.equal(scenarioId('S2 错误邮箱的校验提示'), 'S2');
  assert.equal(scenarioId('S10 S10a 预先授权后显示 Granted'), 'S10a');
  assert.equal(scenarioId('S7a', 'S7'), 'S7a');
  assert.equal(scenarioId('S7'), 'S7a');
  assert.equal(scenarioId('', 'S3', 'ios.iphone17.S3'), 'S3');
  assert.equal(scenarioId('s07-cjk'), 'S7a');
  assert.equal(scenarioId('s10b-permission'), 'S10b');
  assert.equal(scenarioId('flows/final/s21-deeplink.yaml'), 'S21');
  assert.equal(scenarioId('C11 远程推送'), null);
});

test('parseJUnit reads the four formats', () => {
  const pick = (dir) => {
    const d = path.join(ROOT, 'suites', dir);
    if (!fs.existsSync(d)) return null;
    const f = fs.readdirSync(d).filter((x) => x.endsWith('.xml')).map((x) => path.join(d, x)).sort((a, b) => fs.statSync(b).size - fs.statSync(a).size)[0];
    return f ?? null;
  };
  for (const dir of ['quiesco/reports/ios-final', 'appium/reports/ios-final', 'maestro/reports/ios-final']) {
    const f = pick(dir);
    if (!f) continue;
    const cases = parseJUnit(f);
    assert.ok(cases.length > 0, dir);
    for (const c of cases) assert.ok(scenarioId(c.name, c.suite, c.classname, c.file), `${dir}: ${c.name}`);
  }
});

test('composeScenarios: timing from marks, first reset only', () => {
  const cases = [
    { name: 'S10 S10a x', suite: '', classname: '', file: '', timeMs: 9000, status: 'passed', error: null },
    { name: 'S2 y', suite: '', classname: '', file: '', timeMs: 5000, status: 'failed', error: 'boom' },
  ];
  const marks = [
    { t: 1000, event: 'scenario-start', scenario: 'S10 S10a x' },
    { t: 3000, event: 'reset-end', scenario: 'S10 S10a x' },
    { t: 6000, event: 'reset-end', scenario: 'S10 S10a x' },
    { t: 9000, event: 'scenario-end', scenario: 'S10 S10a x' },
    { t: 9500, event: 'scenario-start', scenario: 'S2 y' },
  ];
  const s = composeScenarios(cases, marks, false);
  const a = s.find((x) => x.id === 'S10a');
  assert.equal(a.resetMs, 2000);
  assert.equal(a.durationMs, 6000);
  assert.equal(s.find((x) => x.id === 'S2').status, 'failed');
  assert.equal(s.find((x) => x.id === 'S1').status, 'missing');
  assert.equal(composeScenarios([], [], true).find((x) => x.id === 'S1').status, 'timeout');
});

import { commonSuiteMs } from '../summarize.mjs';

test('commonSuiteMs: slots of the common scenario set, excluded scenarios and their gaps left out', () => {
  const sc = (id, status, endOffsetMs) => ({ id, status, endOffsetMs, resetMs: 1, durationMs: 1 });
  const run = {
    platform: 'ios',
    scenarios: [sc('S20', 'passed', 100), sc('S21', 'failed', 160), sc('S22', 'skipped', null), sc('S23', 'passed', 200)],
  };
  // S20: 0→100, S21 (excluded): 100→160, S23: 160→200
  assert.equal(commonSuiteMs(run), 100 + 40);
  run.scenarios[0].status = 'failed';
  assert.equal(commonSuiteMs(run), null);
});

test('commonSuiteMs: falls back to resetMs + durationMs for results without endOffsetMs', () => {
  const run = { platform: 'android', scenarios: [{ id: 'S1', status: 'passed', resetMs: 2, durationMs: 3 }, { id: 'S22', status: 'skipped' }] };
  assert.equal(commonSuiteMs(run), 5);
});
