// 共用辅助：状态重置（METHODOLOGY 5）、界面登录（scenarios.md 0.4）、调用 mock server（scenarios.md 0.5）。
import { test as base } from '@quiesco/vitest';
import type { Driver } from '@quiesco/core';

export const MOCK = 'http://localhost:4000';

export async function postJson(path: string, body?: unknown): Promise<void> {
  const res = await fetch(`${MOCK}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path}: ${res.status}`);
}

/**
 * 服务端 /reset + 清除 app 数据并冷启动（不重新安装）。
 * Quiesco 默认在每个测试前做 soft reset（app 内清 AsyncStorage、重置导航并重新挂载），粒度与 METHODOLOGY 5
 * 不同 → 另外用官方 API relaunch({ clearData: true })（iOS：清空数据容器、删除 UserDefaults；Android：pm clear）。
 * iOS 的 clearData 不撤销权限 → 定位权限另外 reset（simctl privacy reset；S10b 需要系统弹窗再次出现）。
 */
export async function resetApp(app: Driver): Promise<void> {
  await postJson('/reset');
  if (app.platform === 'ios') await app.device.setPermission('location', 'reset');
  await app.device.relaunch({ clearData: true });
}

/**
 * harness 的计时标记（METHODOLOGY 7）：场景开始（重置开始）、重置结束、场景结束各发一次到 mock server。
 * 只用于计时，不影响测试；mock server 不可用时忽略。
 */
export async function harnessMark(event: 'scenario-start' | 'reset-end' | 'scenario-end', scenario: string): Promise<void> {
  try {
    await fetch(`${MOCK}/harness/mark`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ event, scenario }),
      signal: AbortSignal.timeout(2000),
    });
  } catch {
    // 计时标记失败不影响测试
  }
}

export async function login(app: Driver): Promise<void> {
  await app.type('login-email', 'user@example.com');
  await app.type('login-password', 'Passw0rd!');
  await app.tap('login-submit');
}

export const test = base;
