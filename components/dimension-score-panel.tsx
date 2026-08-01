import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { ZoomableImage } from '@/components/zoomable-image';
import { Radius, Spacing, Type } from '@/constants/brand';
import type { DimensionScore } from '@/types/analysis';

const ACCENT = '#C8F542';
const TRACK = '#2A3A1A';
const PANEL = '#0B0B0B';

type Props = {
  imageUri?: string | null;
  dimensions: DimensionScore[];
};

function DimensionItem({
  item,
  index,
}: {
  item: DimensionScore;
  index: number;
}) {
  const progress = useSharedValue(0);
  const clamped = Math.min(100, Math.max(0, item.value));

  useEffect(() => {
    progress.value = withDelay(
      120 + index * 70,
      withTiming(clamped / 100, {
        duration: 700,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [clamped, index, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.item}>
      <Text style={styles.label}>{item.label}</Text>
      <Text style={styles.value}>{Math.round(clamped)}</Text>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, fillStyle]} />
      </View>
    </View>
  );
}

/**
 * 多维度打分面板：参考暗色双列进度条样式，维度改为穿搭相关中文标签。
 */
export function DimensionScorePanel({ imageUri, dimensions }: Props) {
  return (
    <View style={styles.panel}>
      {imageUri ? (
        <ZoomableImage
          uri={imageUri}
          style={styles.avatar}
          accessibilityLabel="查看穿搭大图"
        />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]} />
      )}

      <View style={styles.badge}>
        <Text style={styles.badgeText}>分析结果</Text>
      </View>

      <View style={styles.grid}>
        {dimensions.map((item, index) => (
          <DimensionItem key={item.key} item={item} index={index} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: PANEL,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#222',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  avatarPlaceholder: {
    backgroundColor: '#1C1C1E',
  },
  badge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    color: '#000',
    fontSize: Type.footnote,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.lg,
    marginTop: Spacing.sm,
  },
  item: {
    width: '47%',
    gap: 6,
  },
  label: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: Type.footnote,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  value: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -1,
    lineHeight: 40,
  },
  track: {
    height: 7,
    borderRadius: 4,
    backgroundColor: TRACK,
    overflow: 'hidden',
    marginTop: 2,
  },
  fill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: ACCENT,
  },
});
