// 子进程辅助：带超时的命令执行、日志输出到文件的长时间进程。
import { spawn, execFile } from 'node:child_process';
import fs from 'node:fs';

/** 执行命令并返回 stdout（失败时抛出，带 stderr）。 */
export function run(cmd, args = [], { timeoutMs = 120_000, cwd, env, allowFail = false } = {}) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { cwd, env: env ? { ...process.env, ...env } : process.env, timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err && !allowFail) {
        err.message = `${cmd} ${args.join(' ')}: ${err.message}\n${stderr}`.trim();
        reject(err);
      } else resolve(String(stdout));
    });
  });
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * 启动长时间运行的命令，stdout / stderr 写入 logFile。超时后结束整个进程组。
 * 返回 { code, timedOut, startedAt, endedAt }。
 */
export function runLogged(cmd, args, { cwd, env, logFile, timeoutMs }) {
  return new Promise((resolve) => {
    const out = fs.openSync(logFile, 'a');
    const startedAt = Date.now();
    const child = spawn(cmd, args, {
      cwd,
      env: { ...process.env, ...env },
      stdio: ['ignore', out, out],
      detached: true, // 独立进程组，超时时可一并结束子进程
    });
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      fs.appendFileSync(logFile, `\n[harness] suite timeout after ${timeoutMs} ms, killing process group\n`);
      try { process.kill(-child.pid, 'SIGTERM'); } catch {}
      setTimeout(() => { try { process.kill(-child.pid, 'SIGKILL'); } catch {} }, 10_000);
    }, timeoutMs);
    child.on('exit', (code, signal) => {
      clearTimeout(timer);
      fs.closeSync(out);
      resolve({ code: code ?? (signal ? 128 : 1), signal, timedOut, startedAt, endedAt: Date.now() });
    });
  });
}

/** 后台进程（不等待结束）。 */
export function spawnDetached(cmd, args, { cwd, env, logFile } = {}) {
  const out = logFile ? fs.openSync(logFile, 'a') : 'ignore';
  const child = spawn(cmd, args, { cwd, env: { ...process.env, ...env }, stdio: ['ignore', out, out], detached: true });
  child.unref();
  return child;
}

/** 轮询直到 fn() 返回真值或超时（超时抛出）。 */
export async function waitFor(fn, { timeoutMs, intervalMs = 2000, what }) {
  const end = Date.now() + timeoutMs;
  for (;;) {
    const v = await fn().catch(() => undefined);
    if (v) return v;
    if (Date.now() >= end) throw new Error(`timed out after ${timeoutMs} ms waiting for ${what}`);
    await sleep(intervalMs);
  }
}
