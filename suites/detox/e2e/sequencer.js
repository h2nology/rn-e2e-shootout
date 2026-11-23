// 固定按文件名（场景编号）顺序执行（METHODOLOGY 6.3）。Jest 默认按上次耗时 / 失败排序，单个场景的耗时会随排序变化。
const Sequencer = require('@jest/test-sequencer').default;

class ByFileName extends Sequencer {
  sort(tests) {
    return [...tests].sort((a, b) => a.path.localeCompare(b.path));
  }
}

module.exports = ByFileName;
