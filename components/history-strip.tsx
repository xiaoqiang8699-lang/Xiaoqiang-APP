import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Brand, Page, Radius, Spacing } from '@/constants/brand';
import { listHistory } from '@/services/history-store';
import {
  setAnalysisHistoryId,
  setAnalysisImage,
  setAnalysisResult,
} from '@/stores/analysis-store';
import { historyIsValid, historyScore, type HistoryItem } from '@/types/history';

/** 一行 3 张：添加卡 + 历史卡共用间距与尺寸 */
export const HOME_CARD_GAP = Spacing.sm;
const SCREEN_W = Dimensions.get('window').width;
export const HISTORY_CARD_WIDTH = Math.floor(
  (SCREEN_W - Page.insetWide * 2 - HOME_CARD_GAP * 2) / 3,
);
export const HISTORY_CARD_HEIGHT = Math.round(HISTORY_CARD_WIDTH * 1.25);

type Props = {
  userId?: string | null;
  /** 网格首位（通常是「添加穿搭」卡片） */
  leading?: ReactNode;
  selecting?: boolean;
  selectedIds?: string[];
  onToggleSelect?: (item: HistoryItem) => void;
  onItemsChange?: (items: HistoryItem[]) => void;
};

/**
 * 首页卡片网格：自动换行向下排布；支持批量选择态。
 */
export function HistoryStrip({
  userId,
  leading,
  selecting = false,
  selectedIds = [],
  onToggleSelect,
  onItemsChange,
}: Props) {
  const router = useRouter();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const selectedSet = new Set(selectedIds);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        if (!userId) {
          if (alive) {
            setItems([]);
            onItemsChange?.([]);
          }
          return;
        }
        const list = await listHistory(userId);
        if (alive) {
          setItems(list);
          onItemsChange?.(list);
        }
      })();
      return () => {
        alive = false;
      };
    }, [onItemsChange, userId]),
  );

  return (
    <View style={styles.grid}>
      {leading}
      {items.map((item) => {
        const selected = selectedSet.has(item.id);
        return (
          <Pressable
            key={item.id}
            style={({ pressed }) => [
              styles.card,
              pressed && styles.pressed,
              selecting && selected && styles.cardSelected,
            ]}
            onPress={() => {
              if (selecting) {
                onToggleSelect?.(item);
                return;
              }
              setAnalysisImage(item.imageUri);
              setAnalysisResult(item.result);
              setAnalysisHistoryId(item.id);
              router.push('/result');
            }}>
            <Image source={{ uri: item.imageUri }} style={styles.thumb} resizeMode="cover" />
            <View style={styles.meta}>
              <Text style={styles.score}>
                {historyIsValid(item) ? `${historyScore(item) ?? '--'}分` : '未通过'}
              </Text>
              <Text style={styles.date} numberOfLines={1}>
                {formatDate(item.createdAt)}
              </Text>
            </View>
            {selecting ? (
              <View style={[styles.check, selected && styles.checkOn]}>
                {selected ? (
                  <Ionicons name="checkmark" size={14} color={Brand.white} />
                ) : null}
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${m}/${day}`;
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: HOME_CARD_GAP,
  },
  card: {
    width: HISTORY_CARD_WIDTH,
    height: HISTORY_CARD_HEIGHT,
    backgroundColor: Brand.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Brand.hairline,
  },
  cardSelected: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  pressed: { opacity: 0.85 },
  thumb: {
    width: '100%',
    flex: 1,
    backgroundColor: Brand.gray200,
  },
  meta: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 1,
    backgroundColor: Brand.white,
  },
  score: {
    fontSize: 12,
    fontWeight: '700',
    color: Brand.black,
  },
  date: {
    fontSize: 10,
    color: Brand.gray400,
  },
  check: {
    position: 'absolute',
    right: 8,
    bottom: 36,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.95)',
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
});
