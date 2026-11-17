// 动画时长（METHODOLOGY.md 8.4 jitter）：所有动画时长都经过 duration()，
// 施压条件 jitter 下乘以 [animScaleMin, animScaleMax] 之间的随机系数（固定种子）。
import type { StressConfig } from './api';

let min = 1;
let max = 1;
let state = 1;

function next(): number {
  // mulberry32，与 mock-server 相同
  state = (state + 0x6d2b79f5) >>> 0;
  let t = state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function configureAnimations(config: Pick<StressConfig, 'animScaleMin' | 'animScaleMax' | 'seed'>) {
  min = config.animScaleMin;
  max = config.animScaleMax;
  state = config.seed >>> 0;
}

/** 返回经过 jitter 调整的动画时长（毫秒） */
export function duration(baseMs: number): number {
  if (min === 1 && max === 1) return baseMs;
  return Math.round(baseMs * (min + next() * (max - min)));
}

/** Toast 的显示时长固定，不受 jitter 影响 */
export const TOAST_VISIBLE_MS = 2000;
