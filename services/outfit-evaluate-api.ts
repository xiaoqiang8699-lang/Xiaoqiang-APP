import {
  assertOutfitApiConfigured,
  getOutfitEvaluateUrl,
  OutfitApiConfig,
} from '@/constants/api';
import type {
  AIAnalysisResult,
  AnalysisTone,
  DimensionScore,
  InvalidReason,
} from '@/types/analysis';

type ApiEnvelope = {
  code: number;
  message?: string;
  data?: unknown;
};

const DIMENSION_META: { key: string; label: string }[] = [
  { key: 'overall', label: '整体氛围' },
  { key: 'color', label: '色彩搭配' },
  { key: 'fabric', label: '面料质感' },
  { key: 'proportion', label: '廓形比例' },
  { key: 'style', label: '风格完成' },
  { key: 'detail', label: '精致细节' },
];

function clampScore(n: unknown, fallback = 90): number {
  const v = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(100, Math.max(85, Math.round(v)));
}

function asTone(v: unknown): AnalysisTone {
  return v === 'aesthetic_buddy' ? 'aesthetic_buddy' : 'girl_friend';
}

function asInvalidReason(v: unknown): InvalidReason {
  if (v === 'blurry' || v === 'other' || v === 'no_person') return v;
  return 'other';
}

function normalizeDimensions(raw: unknown, overallScore: number): DimensionScore[] {
  const list = Array.isArray(raw) ? raw : [];
  const byKey = new Map<string, number>();

  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const row = item as { key?: unknown; value?: unknown };
    if (typeof row.key === 'string') {
      byKey.set(row.key, clampScore(row.value, overallScore));
    }
  }

  return DIMENSION_META.map((meta) => ({
    key: meta.key,
    label: meta.label,
    value:
      meta.key === 'overall'
        ? overallScore
        : (byKey.get(meta.key) ?? overallScore),
  }));
}

function normalizeAdvice(raw: unknown): [string] | [string, string] {
  const list = Array.isArray(raw)
    ? raw.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    : [];
  if (list.length >= 2) return [list[0], list[1]];
  if (list.length === 1) return [list[0]];
  return ['可以再试一张光线更均匀的全身或半身穿搭照，细节会更准哦。'];
}

/**
 * 将接口 data 规范为前端 AIAnalysisResult
 */
export function normalizeOutfitResult(data: unknown): AIAnalysisResult {
  if (!data || typeof data !== 'object') {
    throw new Error('接口返回数据为空');
  }

  const raw = data as Record<string, unknown>;

  if (raw.is_valid === false) {
    return {
      is_valid: false,
      invalid_reason: asInvalidReason(raw.invalid_reason),
      praise:
        typeof raw.praise === 'string' && raw.praise.trim()
          ? raw.praise
          : '这张图好有氛围，不过我更想好好看看你和今日穿搭～换一张半身或全身穿搭照再试一次吧。',
    };
  }

  const overallFromDim = Array.isArray(raw.dimensions)
    ? (raw.dimensions as { key?: string; value?: number }[]).find((d) => d.key === 'overall')
        ?.value
    : undefined;

  const score = clampScore(raw.score ?? overallFromDim, 90);
  const dimensions = normalizeDimensions(raw.dimensions, score);

  return {
    is_valid: true,
    tone: asTone(raw.tone),
    score: dimensions.find((d) => d.key === 'overall')?.value ?? score,
    dimensions,
    praise:
      typeof raw.praise === 'string' && raw.praise.trim()
        ? raw.praise
        : '今天这身很有感觉，细节和整体氛围都不错。',
    analysis:
      typeof raw.analysis === 'string' && raw.analysis.trim()
        ? raw.analysis
        : '整体色彩与版型较为协调，风格统一，完成度不错。',
    advice: normalizeAdvice(raw.advice),
  };
}

/**
 * 将接口错误信息整理成可读中文（避免把整段 JSON 弹给用户）
 */
export function formatOutfitApiError(raw: unknown): string {
  if (raw == null) return '评估失败，请稍后重试';

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('<')) {
      try {
        // 形如：穿搭评估失败: {"statusCode":400,"message":"..."}
        const jsonStart = trimmed.indexOf('{');
        if (jsonStart >= 0) {
          const parsed = JSON.parse(trimmed.slice(jsonStart)) as {
            message?: string;
            code?: string;
          };
          const inner = parsed.message || '';
          if (/InvalidParameter|URL does not appear to be valid/i.test(inner)) {
            return '图片格式未被服务端识别，请重新选择照片后再试';
          }
          if (/width|height|larger than/i.test(inner)) {
            return '图片尺寸过小，请换一张更清晰的穿搭照';
          }
          if (inner) {
            // 去掉阿里云尖括号包装
            const cleaned = inner.replace(/^<\d+\s*>\s*/i, '').trim();
            return cleaned.length > 120 ? `${cleaned.slice(0, 120)}…` : cleaned;
          }
        }
      } catch {
        // fall through
      }
    }
    if (/穿搭评估失败/i.test(trimmed) && /InvalidParameter/i.test(trimmed)) {
      return '图片参数未被识别，请重新拍照或换一张后重试';
    }
    return trimmed.length > 160 ? `${trimmed.slice(0, 160)}…` : trimmed;
  }

  if (raw instanceof Error) return formatOutfitApiError(raw.message);
  return '评估失败，请稍后重试';
}

/**
 * 调用穿搭评估开放接口
 * POST /store/pub/openApi/outfitEvaluate.api
 */
export async function requestOutfitEvaluate(image: string): Promise<AIAnalysisResult> {
  assertOutfitApiConfigured();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OutfitApiConfig.timeoutMs);

  try {
    const response = await fetch(getOutfitEvaluateUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apiKey: OutfitApiConfig.apiKey,
      },
      body: JSON.stringify({ image }),
      signal: controller.signal,
    });

    const payload = (await response.json()) as ApiEnvelope;

    if (!response.ok) {
      throw new Error(formatOutfitApiError(payload.message || `网络错误（${response.status}）`));
    }

    if (payload.code !== 0) {
      throw new Error(formatOutfitApiError(payload.message || '评估失败，请稍后重试'));
    }

    return normalizeOutfitResult(payload.data);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('分析超时，请检查网络后重试');
    }
    if (error instanceof Error) {
      throw new Error(formatOutfitApiError(error.message));
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
