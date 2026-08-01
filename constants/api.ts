/**
 * 穿搭评估接口配置（见 docs/outfit_evaluation_api_doc.md）
 * 生产环境必须通过 .env 注入 EXPO_PUBLIC_OUTFIT_API_*，禁止把真实 Key 写进仓库。
 */
const rawKey = process.env.EXPO_PUBLIC_OUTFIT_API_KEY?.trim() ?? '';

export const OutfitApiConfig = {
  baseUrl:
    process.env.EXPO_PUBLIC_OUTFIT_API_BASE_URL?.replace(/\/$/, '') ||
    (__DEV__ ? 'https://dev.aizhitree.com' : ''),
  path:
    process.env.EXPO_PUBLIC_OUTFIT_API_PATH ||
    '/store/pub/openApi/outfitEvaluate.api',
  /** 鉴权 Header：apiKey（仅来自环境变量） */
  apiKey: rawKey,
  timeoutMs: Number(process.env.EXPO_PUBLIC_OUTFIT_API_TIMEOUT_MS || 90000),
  useMock: process.env.EXPO_PUBLIC_USE_MOCK_AI === '1',
} as const;

export function getOutfitEvaluateUrl(): string {
  if (!OutfitApiConfig.baseUrl) {
    throw new Error('未配置 EXPO_PUBLIC_OUTFIT_API_BASE_URL，无法发起测评');
  }
  return `${OutfitApiConfig.baseUrl}${OutfitApiConfig.path}`;
}

export function assertOutfitApiConfigured(): void {
  if (OutfitApiConfig.useMock) return;
  if (!OutfitApiConfig.baseUrl) {
    throw new Error('未配置测评服务地址，请联系运营方');
  }
  if (!OutfitApiConfig.apiKey) {
    throw new Error('未配置测评服务密钥，请在环境变量中设置 EXPO_PUBLIC_OUTFIT_API_KEY');
  }
}
