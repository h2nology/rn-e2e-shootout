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

export async function login(app: Driver): Promise<void> {
  await app.type('login-email', 'user@example.com');
  await app.type('login-password', 'Passw0rd!');
  await app.tap('login-submit');
}

export const test = base;
