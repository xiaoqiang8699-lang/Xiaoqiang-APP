import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Brand, Radius, Spacing, Type } from '@/constants/brand';
import { ANALYSIS_LOADING_MESSAGES } from '@/services/analyze-outfit';

type Props = {
  visible: boolean;
};

export function AnalysisOverlay({ visible }: Props) {
  const [messageIndex, setMessageIndex] = useState(0);
  const scan = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setMessageIndex(0);
    scan.value = 0;
    scan.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );

    const id = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % ANALYSIS_LOADING_MESSAGES.length);
    }, 1100);

    return () => clearInterval(id);
  }, [scan, visible]);

  const lineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scan.value * 240 }],
  }));

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.View style={[styles.scanLine, lineStyle]} />
      <View style={styles.captionBox}>
        <Text style={styles.caption}>{ANALYSIS_LOADING_MESSAGES[messageIndex]}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Brand.overlay,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  scanLine: {
    position: 'absolute',
    top: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
    height: 1.5,
    backgroundColor: Brand.white,
    opacity: 0.9,
    borderRadius: 1,
  },
  captionBox: {
    margin: Spacing.lg,
    marginBottom: Spacing.xl,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  caption: {
    color: Brand.black,
    fontSize: Type.subhead,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: -0.1,
  },
});
