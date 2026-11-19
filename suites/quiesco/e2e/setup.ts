// 每个测试前的状态重置（METHODOLOGY 5）。quiesco() 设置 isolate: false（模块在文件之间共享），
// 所有文件共用的 hook 放在 setupFiles 中（每个文件执行前都会运行，Quiesco 0.8.0 文档的写法）。
import { test } from '@quiesco/vitest';
import { resetApp } from './support';

test.beforeEach(async ({ app }) => resetApp(app));
