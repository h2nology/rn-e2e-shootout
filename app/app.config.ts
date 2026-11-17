// 各测试工具对 app 的改动按 E2E_TOOL 叠加，基础配置（app.json）保持中立。
// 每个工具的叠加内容即“对 app 的侵入”，计入该工具的易用性数据（METHODOLOGY 10.3）。
import type { ConfigContext, ExpoConfig } from 'expo/config';

const TOOL = process.env.E2E_TOOL ?? 'none';

const overlays: Record<string, (c: ExpoConfig) => ExpoConfig> = {
  none: (c) => c,
  // Detox：社区插件 expo-detox-config-plugin（Android 原生配置、ProGuard keep 规则、network security config）
  detox: (c) => ({ ...c, plugins: [...(c.plugins ?? []), 'expo-detox-config-plugin'] }),
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const overlay = overlays[TOOL];
  if (!overlay) throw new Error(`Unknown E2E_TOOL: ${TOOL}`);
  return overlay(config as ExpoConfig);
};
