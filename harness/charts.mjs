// summary.json → 静态 SVG 图表（results/charts/）。每个（版本 × 施压条件）两张：
//   suite-time-<variant>-<stress>.svg：共同场景集的整套耗时（commonSuiteMs，METHODOLOGY 9 v15）：中位数点、p90 刻度、min–max 线
//   suite-failure-<variant>-<stress>.svg：整套失败率与 95% Wilson 区间
// 一行一个（工具 × 平台），行标签写明工具与平台（颜色不是唯一的识别方式）；每个标记带 <title>（悬停提示）；
// 精确数值见 summary.json。配色：categorical 前 4 个槽位（dataviz 参考调色板，已用 validate_palette.js 验证两种模式）。
import fs from 'node:fs';
import path from 'node:path';

const TOOL_ORDER = ['quiesco', 'detox', 'appium', 'maestro'];
const TOOL_NAME = { quiesco: 'Quiesco', detox: 'Detox', appium: 'Appium', maestro: 'Maestro' };
const PLATFORM_NAME = { ios: 'iOS', android: 'Android' };

const STYLE = `
  svg { --surface: #fcfcfb; --text-1: #0b0b0b; --text-2: #52514e; --grid: #e4e3df;
        --s-quiesco: #2a78d6; --s-detox: #eb6834; --s-appium: #1baf7a; --s-maestro: #eda100; }
  @media (prefers-color-scheme: dark) {
    svg { --surface: #1a1a19; --text-1: #f0efec; --text-2: #c3c2b7; --grid: #34332f;
          --s-quiesco: #3987e5; --s-detox: #d95926; --s-appium: #199e70; --s-maestro: #c98500; }
  }
  .bg { fill: var(--surface); }
  text { font: 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: var(--text-2); }
  .title { font-size: 14px; font-weight: 600; fill: var(--text-1); }
  .label { fill: var(--text-1); }
  .grid { stroke: var(--grid); stroke-width: 1; }
  .range { stroke-width: 2; stroke-linecap: round; }
  .dot { stroke: var(--surface); stroke-width: 2; }
  .hit { fill: transparent; }
  .hit:hover + g .dot { r: 7; }
`;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function niceTicks(max, count = 5) {
  if (!(max > 0)) return [0, 1];
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw);
  const ticks = [];
  for (let v = 0; v <= max + step * 0.001; v += step) ticks.push(Number(v.toFixed(10)));
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}

function rows(groups) {
  return [...groups].sort(
    (a, b) => TOOL_ORDER.indexOf(a.tool) - TOOL_ORDER.indexOf(b.tool) || (a.platform === 'ios' ? -1 : 1) - (b.platform === 'ios' ? -1 : 1),
  );
}

function frame({ title, subtitle, rowsData, maxX, fmt, axisLabel, body }) {
  const W = 760;
  const L = 150; // 行标签
  const R = 110; // 右侧数值标签
  const T = 58;
  const RH = 30;
  const H = T + rowsData.length * RH + 40;
  const ticks = niceTicks(maxX);
  const xMax = ticks[ticks.length - 1];
  const x = (v) => L + ((W - L - R) * v) / xMax;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(title)}">`;
  s += `<style>${STYLE}</style><rect class="bg" width="${W}" height="${H}"/>`;
  s += `<text class="title" x="16" y="24">${esc(title)}</text><text x="16" y="42">${esc(subtitle)}</text>`;
  for (const t of ticks) {
    s += `<line class="grid" x1="${x(t)}" x2="${x(t)}" y1="${T - 6}" y2="${T + rowsData.length * RH}"/>`;
    s += `<text x="${x(t)}" y="${T + rowsData.length * RH + 16}" text-anchor="middle">${esc(fmt(t))}</text>`;
  }
  s += `<text x="${(L + W - R) / 2}" y="${H - 6}" text-anchor="middle">${esc(axisLabel)}</text>`;
  rowsData.forEach((g, i) => {
    const y = T + i * RH + RH / 2;
    s += `<text class="label" x="${L - 12}" y="${y + 4}" text-anchor="end">${esc(`${TOOL_NAME[g.tool] ?? g.tool} · ${PLATFORM_NAME[g.platform] ?? g.platform}`)}</text>`;
    s += body(g, y, x, `var(--s-${g.tool})`, W - R);
  });
  return s + '</svg>\n';
}

function timeChart(groups, variant, stress) {
  const data = rows(groups).filter((g) => g.suite.commonSuiteMs.n > 0);
  if (!data.length) return null;
  const sec = (ms) => ms / 1000;
  const maxX = Math.max(...data.map((g) => sec(g.suite.commonSuiteMs.max)));
  return frame({
    title: `Suite time (common scenario set), ${variant} / ${stress}`,
    subtitle: 'dot = median, tick = p90, line = min–max; scenarios every tool runs on this platform; install and launch excluded',
    rowsData: data,
    maxX,
    fmt: (v) => `${v}`,
    axisLabel: 'seconds',
    body: (g, y, x, color, labelX) => {
      const t = g.suite.commonSuiteMs;
      const tip = `${TOOL_NAME[g.tool]} ${PLATFORM_NAME[g.platform]}: median ${sec(t.median).toFixed(1)} s, p90 ${sec(t.p90).toFixed(1)} s, min ${sec(t.min).toFixed(1)} s, max ${sec(t.max).toFixed(1)} s (n = ${t.n} of ${g.runs} runs with the common set all passed)`;
      return (
        `<rect class="hit" x="${x(0)}" y="${y - 13}" width="${labelX - x(0)}" height="26"><title>${esc(tip)}</title></rect>` +
        `<g pointer-events="none"><line class="range" stroke="${color}" x1="${x(sec(t.min))}" x2="${x(sec(t.max))}" y1="${y}" y2="${y}"/>` +
        `<line stroke="${color}" stroke-width="2" x1="${x(sec(t.p90))}" x2="${x(sec(t.p90))}" y1="${y - 7}" y2="${y + 7}"/>` +
        `<circle class="dot" fill="${color}" cx="${x(sec(t.median))}" cy="${y}" r="5"/></g>` +
        `<text x="${labelX + 10}" y="${y + 4}">${esc(`${sec(t.median).toFixed(1)} s`)}</text>`
      );
    },
  });
}

function failureChart(groups, variant, stress) {
  const data = rows(groups).filter((g) => g.runs > 0);
  if (!data.length) return null;
  const pct = (v) => v * 100;
  const maxX = Math.max(10, ...data.map((g) => pct(g.suite.failureRate.high)));
  return frame({
    title: `Suite failure rate, ${variant} / ${stress}`,
    subtitle: 'dot = runs with at least one failed scenario / runs; line = 95% Wilson interval',
    rowsData: data,
    maxX,
    fmt: (v) => `${v}%`,
    axisLabel: 'failed runs (%)',
    body: (g, y, x, color, labelX) => {
      const f = g.suite.failureRate;
      const tip = `${TOOL_NAME[g.tool]} ${PLATFORM_NAME[g.platform]}: ${g.suite.failures} / ${g.runs} runs failed (${pct(f.rate).toFixed(1)}%), 95% CI ${pct(f.low).toFixed(1)}–${pct(f.high).toFixed(1)}%`;
      return (
        `<rect class="hit" x="${x(0)}" y="${y - 13}" width="${labelX - x(0)}" height="26"><title>${esc(tip)}</title></rect>` +
        `<g pointer-events="none"><line class="range" stroke="${color}" x1="${x(pct(f.low))}" x2="${x(pct(f.high))}" y1="${y}" y2="${y}"/>` +
        `<circle class="dot" fill="${color}" cx="${x(pct(f.rate))}" cy="${y}" r="5"/></g>` +
        `<text x="${labelX + 10}" y="${y + 4}">${esc(`${g.suite.failures} / ${g.runs}`)}</text>`
      );
    },
  });
}

export function writeCharts(summary, dir) {
  fs.mkdirSync(dir, { recursive: true });
  const written = [];
  const keys = [...new Set(summary.groups.map((g) => `${g.variant}|${g.stress}`))];
  for (const k of keys) {
    const [variant, stress] = k.split('|');
    const gs = summary.groups.filter((g) => g.variant === variant && g.stress === stress);
    for (const [name, svg] of [
      [`suite-time-${variant}-${stress}.svg`, timeChart(gs, variant, stress)],
      [`suite-failure-${variant}-${stress}.svg`, failureChart(gs, variant, stress)],
    ]) {
      if (!svg) continue;
      fs.writeFileSync(path.join(dir, name), svg);
      written.push(name);
    }
  }
  return written;
}
