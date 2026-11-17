/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  rootDir: '..',
  testMatch: [`<rootDir>/e2e/${process.env.VARIANT ?? 'final'}/**/*.test.js`],
  // [W3] 模板默认 120 s；S6 在 Detox 下约需 120 s（每步滚动都等待 app 空闲），放宽到 300 s
  testTimeout: process.env.VARIANT === "diagnostic" ? 120000 : 300000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter'],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true,
};
