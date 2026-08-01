import type { AIAnalysisResult } from '@/types/analysis';

export type HistoryItem = {
  id: string;
  userId: string;
  imageUri: string;
  createdAt: string;
  /** 完整测评结论（含解析与建议） */
  result: AIAnalysisResult;
};

/** 列表展示用：是否通过 */
export function historyIsValid(item: HistoryItem): boolean {
  return item.result.is_valid;
}

/** 列表展示用：分数 */
export function historyScore(item: HistoryItem): number | undefined {
  return item.result.is_valid ? item.result.score : undefined;
}
