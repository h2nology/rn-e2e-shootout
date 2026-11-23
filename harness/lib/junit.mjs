// JUnit XML 的解析（Vitest、jest-junit、WebdriverIO、Maestro 的输出）与场景 ID 的统一。
import fs from 'node:fs';

const decode = (s) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&');

function attrs(tag) {
  const out = {};
  for (const m of tag.matchAll(/([\w:-]+)="([^"]*)"/g)) out[m[1]] = decode(m[2]);
  return out;
}

/**
 * 解析一个 JUnit 文件，返回 [{ suite, file, classname, name, timeMs, status, error }]。
 * status：passed / failed / skipped。
 */
export function parseJUnit(xmlPath) {
  const xml = fs.readFileSync(xmlPath, 'utf8');
  const cases = [];
  for (const sm of xml.matchAll(/<testsuite\b([^>]*)>([\s\S]*?)<\/testsuite>/g)) {
    const suite = attrs(sm[1]);
    const fileProp = sm[2].match(/<property name="file" value="([^"]*)"/)?.[1];
    for (const cm of sm[2].matchAll(/<testcase\b([^>]*?)(\/>|>([\s\S]*?)<\/testcase>)/g)) {
      const a = attrs(cm[1]);
      const body = cm[3] ?? '';
      let status = 'passed';
      let error = null;
      const fail = body.match(/<(failure|error)\b([^>]*)(\/>|>([\s\S]*?)<\/\1>)/);
      if (fail) {
        status = 'failed';
        const fa = attrs(fail[2]);
        error = decode(fail[4] ?? fa.message ?? '').trim() || fa.message || 'failed';
      } else if (/<skipped\b/.test(body)) status = 'skipped';
      cases.push({
        suite: suite.name ?? '',
        file: a.file ?? suite.file ?? (fileProp ? decode(fileProp) : '') ?? '',
        classname: a.classname ?? '',
        name: a.name ?? '',
        timeMs: Math.round(Number(a.time ?? 0) * 1000),
        status,
        error: error ? error.slice(0, 4000) : null,
      });
    }
  }
  return cases;
}

/**
 * 统一场景 ID（config.SCENARIOS 的写法）。来源：文件名（s07-cjk.yaml → S7a）、测试名（"S10 S10a 预先授权…" → S10a）。
 * 带字母的编号优先；单独的 S7 视为 S7a（Maestro 的 flow 名、Appium / Detox 的 describe 名）。
 */
export function scenarioId(...sources) {
  for (const src of sources) {
    if (!src) continue;
    const s = String(src);
    const tokens = [...s.matchAll(/(?:^|[^A-Za-z0-9])S(\d{1,2})([ab])?(?![0-9A-Za-z])/g)].map((m) => ({ n: Number(m[1]), x: m[2] ?? '' }));
    const withLetter = tokens.find((t) => t.x);
    if (withLetter) return `S${withLetter.n}${withLetter.x}`;
    if (tokens.length) return norm(tokens[0].n, '');
    const f = s.match(/(?:^|\/)s(\d{2})([ab]?)-[^/]*$/) ?? s.match(/^s(\d{2})([ab]?)-/);
    if (f) return norm(Number(f[1]), f[2]);
  }
  return null;
}

function norm(n, x) {
  if (n === 7 && !x) return 'S7a';
  return `S${n}${x}`;
}
