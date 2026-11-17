// mock server 客户端。Android 模拟器通过 `adb reverse tcp:4000 tcp:4000` 访问 localhost。
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

export type Item = { id: number; title: string };

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body.error ?? `HTTP ${res.status}`);
  return body as T;
}

export const api = {
  config: () => request<StressConfig>('/config'),
  login: (email: string, password: string) =>
    request<{ token: string; email: string }>('/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  items: (q?: string) =>
    request<{ items: Item[] }>(`/items${q ? `?q=${encodeURIComponent(q)}` : ''}`).then((r) => r.items),
  item: (id: number) => request<Item>(`/items/${id}`),
  addItem: (title: string) => request<Item>('/items', { method: 'POST', body: JSON.stringify({ title }) }),
  deleteItem: (id: number) => request<{ ok: true }>(`/items/${id}`, { method: 'DELETE' }),
  pinItem: (id: number) => request<Item>(`/items/${id}/pin`, { method: 'POST' }),
  poll: () => request<{ tick: number }>('/poll'),
  greet: (name: string) => request<{ greeting: string }>('/greet', { method: 'POST', body: JSON.stringify({ name }) }),
};

export type StressConfig = {
  stress: string;
  netDelayMinMs: number;
  netDelayMaxMs: number;
  animScaleMin: number;
  animScaleMax: number;
  seed: number;
};
