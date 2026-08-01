import type { AIAnalysisResult } from '@/types/analysis';

type AnalysisSession = {
  imageUri: string | null;
  result: AIAnalysisResult | null;
  /** 对应历史记录 id，用于回看/删除 */
  historyId: string | null;
};

let session: AnalysisSession = {
  imageUri: null,
  result: null,
  historyId: null,
};

export function setAnalysisImage(uri: string | null) {
  session = { ...session, imageUri: uri };
}

export function setAnalysisResult(result: AIAnalysisResult | null) {
  session = { ...session, result };
}

export function setAnalysisHistoryId(historyId: string | null) {
  session = { ...session, historyId };
}

export function getAnalysisSession(): AnalysisSession {
  return session;
}

export function clearAnalysisSession() {
  session = { imageUri: null, result: null, historyId: null };
}
