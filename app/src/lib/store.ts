// 极简的全局状态：登录态（持久化）和条目列表（乐观更新）。
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { api, type Item } from './api';

const TOKEN_KEY = 'rnshootout.token';

type Row = Item & { pending?: boolean };

type State = {
  token: string | null;
  items: Row[];
  status: 'idle' | 'loading' | 'error' | 'ready';
};

let state: State = { token: null, items: [], status: 'idle' };
const listeners = new Set<() => void>();

function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => selector(state),
    () => selector(state),
  );
}

export const auth = {
  async restore() {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    set({ token });
  },
  async login(email: string, password: string) {
    const { token } = await api.login(email, password);
    await AsyncStorage.setItem(TOKEN_KEY, token);
    set({ token });
  },
};

let tempId = -1;

export const items = {
  async load() {
    set({ status: 'loading' });
    try {
      set({ items: await api.items(), status: 'ready' });
    } catch {
      set({ status: 'error' });
    }
  },
  /** 乐观更新：先插入列表顶部，再请求服务端，成功后换成服务端的 id */
  async add(title: string) {
    const temp: Row = { id: tempId--, title, pending: true };
    set({ items: [temp, ...state.items] });
    try {
      const saved = await api.addItem(title);
      set({ items: state.items.map((i) => (i.id === temp.id ? saved : i)) });
    } catch {
      set({ items: state.items.filter((i) => i.id !== temp.id) });
    }
  },
  async remove(id: number) {
    const before = state.items;
    set({ items: before.filter((i) => i.id !== id) });
    try {
      await api.deleteItem(id);
    } catch {
      set({ items: before });
    }
  },
  async pin(id: number) {
    const item = state.items.find((i) => i.id === id);
    if (!item) return;
    set({ items: [item, ...state.items.filter((i) => i.id !== id)] });
    await api.pinItem(id).catch(() => undefined);
  },
};
