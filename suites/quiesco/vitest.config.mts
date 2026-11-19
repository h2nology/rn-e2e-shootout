// Vitest + Quiesco。VARIANT=diagnostic|final 选择测试目录（默认 final），JUnit 输出到 reports/<platform>-<variant>/。
// quiesco()：每个 worker 一个 app 会话、按文件依次执行；自动重试全部关闭（METHODOLOGY 6.1）。
import { quiesco, quiescoPlugin } from '@quiesco/vitest/config';
import { defineConfig } from 'vitest/config';

const VARIANT = process.env.VARIANT ?? 'final';
const PLATFORM = process.env.QUIESCO_PLATFORM ?? 'ios';

export default defineConfig({
  plugins: [quiescoPlugin()],
  test: {
    ...quiesco(),
    include: [process.env.SPEC ?? `e2e/${VARIANT}/**/*.test.ts`],
    retry: 0,
    bail: 0,
    testTimeout: 120_000,
    reporters: ['default', ['junit', { outputFile: `reports/${PLATFORM}-${VARIANT}/junit-${Date.now()}.xml` }]],
  },
});
