#!/usr/bin/env python3
"""Quiesco timeline（QUIESCO_TIMELINE=all）按环节汇总，对比两个平台。

用法：scripts/timeline-breakdown.py <ios artifacts 目录> <android artifacts 目录>
（suites/quiesco/artifacts/<stamp>-<platform>，每个场景一个子目录，含 timeline.trace.json）

每个场景：
  - reset：Quiesco 的 soft reset（场景之间）
  - action:<动词>：操作区段（type / tap / scroll …），含操作前后的空闲等待
  - idle-wait：sync "wait for idle" 区段之和（与 action 重叠，单独列出）
  - untraced：第一个区段开始到最后一个区段结束之间，不在任何 reset / action 区段内的时间
    （测试代码自身：beforeEach 的 /reset、relaunch、设备操作等）
"""
from __future__ import annotations

import json
import re
import sys
from collections import defaultdict
from pathlib import Path


def scenario_id(dirname: str) -> str | None:
    m = re.match(r"\d+-(S\d+[ab]?)-", dirname)
    return m.group(1) if m else None


def load(root: Path) -> dict[str, dict[str, float]]:
    out: dict[str, dict[str, float]] = {}
    for d in sorted(root.iterdir()):
        sid = scenario_id(d.name)
        f = d / "timeline.trace.json"
        if not sid or not f.exists():
            continue
        ev = [e for e in json.loads(f.read_text())["traceEvents"] if e.get("ph") == "X"]
        if not ev:
            continue
        cat: dict[str, float] = defaultdict(float)
        spans = []
        for e in ev:
            s, dur = e["ts"] / 1e6, e["dur"] / 1e6
            if e["cat"] == "reset":
                cat["reset"] += dur
                spans.append((s, s + dur))
            elif e["cat"] == "action":
                verb = e["name"].split()[1] if len(e["name"].split()) > 1 else e["name"]
                cat[f"action:{verb}"] += dur
                spans.append((s, s + dur))
            elif e["cat"] == "sync":
                cat["idle-wait"] += dur
            else:
                cat[f"other:{e['cat']}"] += dur
        start = min(a for a, _ in spans) if spans else 0
        end = max(b for _, b in spans) if spans else 0
        # 合并区段求覆盖长度
        covered, cur = 0.0, None
        for a, b in sorted(spans):
            if cur is None or a > cur[1]:
                if cur:
                    covered += cur[1] - cur[0]
                cur = [a, b]
            else:
                cur[1] = max(cur[1], b)
        if cur:
            covered += cur[1] - cur[0]
        cat["untraced"] = (end - start) - covered
        cat["total"] = end - start
        out[sid] = dict(cat)
    return out


def main() -> None:
    ios, android = load(Path(sys.argv[1])), load(Path(sys.argv[2]))
    sids = [s for s in ios if s in android]
    keys = sorted({k for s in sids for k in (*ios[s], *android[s])} - {"total"}, key=lambda k: (k != "reset", k))
    tot_i = defaultdict(float)
    tot_a = defaultdict(float)
    print("## 每个场景（秒，iOS / Android / 差）\n")
    print("| 场景 | 合计 | " + " | ".join(keys) + " |")
    print("|---|---|" + "---|" * len(keys))
    for s in sids:
        cells = []
        for k in ["total", *keys]:
            i, a = ios[s].get(k, 0.0), android[s].get(k, 0.0)
            tot_i[k] += i
            tot_a[k] += a
            cells.append(f"{i:.1f} / {a:.1f} / {i - a:+.1f}")
        print(f"| {s} | " + " | ".join(cells) + " |")
    print("\n## 全部场景合计（秒）\n")
    print("| 环节 | iOS | Android | 差 |")
    print("|---|---|---|---|")
    for k in ["total", *keys]:
        print(f"| {k} | {tot_i[k]:.1f} | {tot_a[k]:.1f} | {tot_i[k] - tot_a[k]:+.1f} |")
    # 操作次数与平均
    print("\n## 操作的平均耗时（秒 / 次，含前后空闲等待）\n")
    counts_i, counts_a = defaultdict(int), defaultdict(int)
    for root, counts in ((Path(sys.argv[1]), counts_i), (Path(sys.argv[2]), counts_a)):
        for d in root.iterdir():
            f = d / "timeline.trace.json"
            if scenario_id(d.name) in sids and f.exists():
                for e in json.loads(f.read_text())["traceEvents"]:
                    if e.get("cat") == "action":
                        counts[e["name"].split()[1]] += 1
    print("| 操作 | iOS 次数 | iOS 平均 | Android 次数 | Android 平均 |")
    print("|---|---|---|---|---|")
    for verb in sorted(set(counts_i) | set(counts_a)):
        k = f"action:{verb}"
        ci, ca = counts_i[verb], counts_a[verb]
        print(f"| {verb} | {ci} | {tot_i[k] / ci if ci else 0:.2f} | {ca} | {tot_a[k] / ca if ca else 0:.2f} |")


if __name__ == "__main__":
    main()
