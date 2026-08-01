import { StyleSheet, Text, View } from 'react-native';

import { Brand, Type } from '@/constants/brand';
import { Copy } from '@/constants/copy';

type Props = {
  score: number;
  size?: number;
};

export function ScoreRing({ score, size = 148 }: Props) {
  const clamped = Math.min(100, Math.max(85, Math.round(score)));

  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2 }]}>
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      />
      <View style={styles.center}>
        <Text style={styles.score}>{clamped}</Text>
        <Text style={styles.hint}>{Copy.scoreHint}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.white,
  },
  ring: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 10,
    borderColor: Brand.black,
    opacity: 0.92,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: {
    fontSize: 44,
    fontWeight: '700',
    color: Brand.black,
    letterSpacing: -1.2,
  },
  hint: {
    marginTop: 2,
    fontSize: Type.footnote,
    color: Brand.gray400,
    fontWeight: '500',
  },
});
