// 各测试工具对 app 的改动按 E2E_TOOL 叠加，基础配置（app.json）保持中立。
// 每个工具的叠加内容即“对 app 的侵入”，计入该工具的易用性数据（METHODOLOGY 10.3）。
import type { ConfigContext, ExpoConfig } from 'expo/config';

const TOOL = process.env.E2E_TOOL ?? 'none';

const overlays: Record<string, (c: ExpoConfig) => ExpoConfig> = {
  none: (c) => c,
  // Detox：社区插件 expo-detox-config-plugin（Android 原生配置、ProGuard keep 规则、network security config）
  detox: (c) => ({ ...c, plugins: [...(c.plugins ?? []), 'expo-detox-config-plugin'] }),
  // Quiesco：开关是 prebuild / 打包时的 EXPO_PUBLIC_QUIESCO=1，不在这里叠加。
  // @quiesco/expo-plugin 必须一直在 app.json 中：非 e2e 构建时由它把 @quiesco/native 排除出自动链接
  // （不在时反而会被链接进其他工具的构建）；metro.config.js 的 withQuiesco() 同理把 agent 换成空实现。
  // C10 iOS：Quiesco 的 setLocale 要求 Info.plist 声明 CFBundleLocalizations（否则报 “does it support ja-JP?”）。
  // Appium / Maestro 直接传 -AppleLanguages 不需要；只加在 Quiesco 的构建里（用户决定，2026-11-19）
  quiesco: (c) => ({
    ...c,
    ios: { ...c.ios, infoPlist: { ...c.ios?.infoPlist, CFBundleLocalizations: ['en', 'ja', 'zh-Hans'] } },
  }),
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const overlay = overlays[TOOL];
  if (!overlay) throw new Error(`Unknown E2E_TOOL: ${TOOL}`);
  return overlay(config as ExpoConfig);
};
