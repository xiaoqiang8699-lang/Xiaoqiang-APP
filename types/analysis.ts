export type AnalysisTone = 'girl_friend' | 'aesthetic_buddy';

export type InvalidReason = 'no_person' | 'blurry' | 'other';

/** 多维度打分单项 */
export type DimensionScore = {
  /** 稳定 key，用于渲染 */
  key: string;
  /** 中文标签 */
  label: string;
  /** 85–100 */
  value: number;
};

export type AIAnalysisResult =
  | {
      is_valid: false;
      praise: string;
      invalid_reason?: InvalidReason;
    }
  | {
      is_valid: true;
      /** 综合氛围分（与 dimensions 中「整体」一致） */
      score: number;
      /** 多维打分，通常 6 项 */
      dimensions: DimensionScore[];
      praise: string;
      analysis: string;
      advice: [string] | [string, string];
      tone: AnalysisTone;
    };

export type HomePhase = 'empty' | 'preview';
