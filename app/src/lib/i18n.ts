// C10：根据系统语言切换登录按钮等少量文字。其他界面统一为英文（scenarios.md 0.1）。
import { getLocales } from 'expo-localization';

const strings = {
  en: { signIn: 'Sign in' },
  ja: { signIn: 'ログイン' },
  zh: { signIn: '登录' },
} as const;

type Lang = keyof typeof strings;

export function t(key: keyof (typeof strings)['en']): string {
  const code = getLocales()[0]?.languageCode ?? 'en';
  const lang: Lang = code === 'ja' || code === 'zh' ? code : 'en';
  return strings[lang][key];
}
