// Vitest + Quiesco。VARIANT=diagnostic|final 选择测试目录（默认 final），JUnit 输出到 reports/<platform>-<variant>/。
// quiesco()：每个 worker 一个 app 会话、按文件依次执行；自动重试全部关闭（METHODOLOGY 6.1）。
import { quiesco, quiescoPlugin } from '@quiesco/vitest/config';
import { BaseSequencer, type TestSpecification } from 'vitest/node';
import { defineConfig } from 'vitest/config';

// 固定按文件名（场景编号）顺序执行（METHODOLOGY 6.3）。Vitest 默认按上次耗时排序，单个场景的耗时会随排序变化
// （0.13.3：S8 排到前面后承担 XCUITest runner 启动，findings.md）。
class ByFileName extends BaseSequencer {
  async sort(files: TestSpecification[]) {
    return [...files].sort((a, b) => a.moduleId.localeCompare(b.moduleId));
  }
}

const VARIANT = process.env.VARIANT ?? 'final';
const PLATFORM = process.env.QUIESCO_PLATFORM ?? 'ios';

export default defineConfig({
  plugins: [quiescoPlugin()],
  test: {
    ...quiesco(),
    include: [process.env.SPEC ?? `e2e/${VARIANT}/**/*.test.ts`],
    // 每个测试前的重置（e2e/setup.ts）
    setupFiles: ['e2e/setup.ts'],
    sequence: { sequencer: ByFileName },
    retry: 0,
    bail: 0,
    testTimeout: 120_000,
    reporters: ['default', ['junit', { outputFile: `reports/${PLATFORM}-${VARIANT}/junit-${Date.now()}.xml` }]],
  },
});
