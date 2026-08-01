import { OutfitApiConfig } from '@/constants/api';
import { imageUriToBase64 } from '@/services/image-to-base64';
import { requestOutfitEvaluate } from '@/services/outfit-evaluate-api';
import type { AIAnalysisResult, AnalysisTone, DimensionScore } from '@/types/analysis';

function resolveTone(): AnalysisTone {
  const forced = process.env.EXPO_PUBLIC_FORCE_TONE;
  if (forced === 'girl_friend' || forced === 'aesthetic_buddy') {
    return forced;
  }
  return 'girl_friend';
}

function buildDimensions(
  values: [number, number, number, number, number, number],
): DimensionScore[] {
  const labels: { key: string; label: string }[] = [
    { key: 'overall', label: '整体氛围' },
    { key: 'color', label: '色彩搭配' },
    { key: 'fabric', label: '面料质感' },
    { key: 'proportion', label: '廓形比例' },
    { key: 'style', label: '风格完成' },
    { key: 'detail', label: '精致细节' },
  ];

  return labels.map((item, index) => ({
    ...item,
    value: values[index],
  }));
}

function buildValidMock(tone: AnalysisTone): AIAnalysisResult {
  if (tone === 'aesthetic_buddy') {
    const dimensions = buildDimensions([91, 93, 90, 94, 92, 88]);
    return {
      is_valid: true,
      score: dimensions[0].value,
      dimensions,
      tone,
      praise:
        '今天这身干净利落，比例和层次都在线。不是「随便穿」，是「懂自己」的松弛感，看着就舒服。',
      analysis:
        '色彩上以低饱和中性色为主，明度过渡自然，整体不抢戏。面料质感偏挺括与雾面结合，轮廓利落，气质偏都市休闲。',
      advice: [
        '可加一件浅色内搭或细金属配饰，拉开明度层次，让整体更透气。',
        '鞋履若换成同色系麂皮或雾面质感，会和上衣材质更统一。',
      ],
    };
  }

  const dimensions = buildDimensions([94, 96, 93, 95, 97, 92]);
  return {
    is_valid: true,
    score: dimensions[0].value,
    dimensions,
    tone,
    praise:
      '姐妹今日状态绝了！整身气场温柔又不甜腻，像刚从杂志街拍走出来——自信这件事，你今天穿明白了。',
    analysis:
      '色彩季感偏柔和：主色与点缀色明度接近，过渡顺滑。面料有轻盈垂感，廓形贴合线条，风格统一，氛围完成度高。',
    advice: [
      '耳饰或细项链选哑光金属，比高光饰品更搭今天的雾感面料。',
      '包袋若换成同色系迷你款，会把腰线视觉再抬一点，比例更完整。',
    ],
  };
}

function buildInvalidMock(): AIAnalysisResult {
  return {
    is_valid: false,
    invalid_reason: 'no_person',
    praise:
      '这张图好有氛围，不过我更想好好看看「你」和今日穿搭～换一张全身或半身穿搭照，我立刻给你专属夸夸和造型密码。',
  };
}

async function analyzeWithMock(_imageUri: string): Promise<AIAnalysisResult> {
  await new Promise((resolve) => setTimeout(resolve, 1800));

  if (process.env.EXPO_PUBLIC_FORCE_INVALID === '1') {
    return buildInvalidMock();
  }

  return buildValidMock(resolveTone());
}

/**
 * 穿搭分析入口：默认调用开放接口；可用 EXPO_PUBLIC_USE_MOCK_AI=1 回退 Mock。
 */
export async function analyzeOutfit(imageUri: string): Promise<AIAnalysisResult> {
  if (OutfitApiConfig.useMock) {
    return analyzeWithMock(imageUri);
  }

  // 公网 URL 可直接传；本地 file:// / content:// 转纯 Base64
  const image =
    /^https?:\/\//i.test(imageUri) ? imageUri : await imageUriToBase64(imageUri);

  return requestOutfitEvaluate(image);
}

export const ANALYSIS_LOADING_MESSAGES = [
  '正在分析面部轮廓...',
  '提取今日穿搭色彩...',
  '评估面料质感与氛围...',
] as const;
