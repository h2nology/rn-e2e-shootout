// harness 的计时标记的 hook（METHODOLOGY 7）。setupFilesAfterEnv 中注册的 beforeEach 先于测试文件的 beforeEach（resetApp）执行。
const { harnessMark } = require('./harness-mark');

beforeEach(() => harnessMark('scenario-start'));
afterEach(() => harnessMark('scenario-end'));
