import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AIAnalysisResult, DimensionScore } from '@/types/analysis';
import type { HistoryItem } from '@/types/history';

const HISTORY_KEY = '@ai_style/history_v2';
const LEGACY_KEY = '@ai_style/history_v1';
const MAX_ITEMS = 40;

type LegacyHistoryItem = {
  id: string;
  userId: string;
  imageUri: string;
  createdAt: string;
  isValid?: boolean;
  score?: number;
  praise?: string;
  tone?: string;
  analysis?: string;
  advice?: string[];
  dimensions?: DimensionScore[];
  result?: AIAnalysisResult;
};

function legacyToResult(item: LegacyHistoryItem): AIAnalysisResult {
  if (item.result) return item.result;

  if (item.isValid === false) {
    return {
      is_valid: false,
      praise: item.praise ?? '',
      invalid_reason: 'other',
    };
  }

  const score = item.score ?? 90;
  const advice =
    item.advice && item.advice.length >= 2
      ? ([item.advice[0], item.advice[1]] as [string, string])
      : item.advice && item.advice.length === 1
        ? ([item.advice[0]] as [string])
        : (['可再拍一张新照，获取最新完整报告。'] as [string]);

  return {
    is_valid: true,
    score,
    tone: item.tone === 'aesthetic_buddy' ? 'aesthetic_buddy' : 'girl_friend',
    dimensions: item.dimensions ?? [
      { key: 'overall', label: '整体氛围', value: score },
      { key: 'color', label: '色彩搭配', value: score },
      { key: 'fabric', label: '面料质感', value: score },
      { key: 'proportion', label: '廓形比例', value: score },
      { key: 'style', label: '风格完成', value: score },
      { key: 'detail', label: '精致细节', value: score },
    ],
    praise: item.praise ?? '',
    analysis:
      item.analysis ??
      '该条为旧版历史，未保存完整解析。重新测评可获得专业理论解析与优化建议。',
    advice,
  };
}

function normalizeItem(raw: unknown): HistoryItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as LegacyHistoryItem;
  if (!item.id || !item.userId || !item.imageUri || !item.createdAt) return null;

  return {
    id: item.id,
    userId: item.userId,
    imageUri: item.imageUri,
    createdAt: item.createdAt,
    result: legacyToResult(item),
  };
}

async function readAll(): Promise<HistoryItem[]> {
  const raw = (await AsyncStorage.getItem(HISTORY_KEY)) ?? (await AsyncStorage.getItem(LEGACY_KEY));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeItem).filter((x): x is HistoryItem => x !== null);
  } catch {
    return [];
  }
}

async function writeAll(items: HistoryItem[]): Promise<void> {
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(items));
}

export async function listHistory(userId: string): Promise<HistoryItem[]> {
  const all = await readAll();
  return all
    .filter((item) => item.userId === userId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function addHistoryItem(input: {
  userId: string;
  imageUri: string;
  result: AIAnalysisResult;
}): Promise<HistoryItem> {
  const item: HistoryItem = {
    id: `h_${Date.now()}`,
    userId: input.userId,
    imageUri: input.imageUri,
    createdAt: new Date().toISOString(),
    result: input.result,
  };

  const all = await readAll();
  const next = [item, ...all.filter((x) => !(x.userId === input.userId && x.id === item.id))];
  const mine = next.filter((x) => x.userId === input.userId).slice(0, MAX_ITEMS);
  const others = next.filter((x) => x.userId !== input.userId);
  await writeAll([...mine, ...others]);
  return item;
}

export async function deleteHistoryItem(userId: string, historyId: string): Promise<void> {
  const all = await readAll();
  await writeAll(all.filter((x) => !(x.userId === userId && x.id === historyId)));
}

export async function deleteHistoryItems(userId: string, historyIds: string[]): Promise<void> {
  if (historyIds.length === 0) return;
  const idSet = new Set(historyIds);
  const all = await readAll();
  await writeAll(all.filter((x) => !(x.userId === userId && idSet.has(x.id))));
}

/** 删除某用户全部穿搭历史（账号注销时调用） */
export async function clearHistoryForUser(userId: string): Promise<void> {
  const all = await readAll();
  await writeAll(all.filter((x) => x.userId !== userId));
}
