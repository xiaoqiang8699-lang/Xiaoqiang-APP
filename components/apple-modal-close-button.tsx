import { Ionicons } from '@expo/vector-icons';
import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

/**
 * 苹果弹窗关闭按钮：
 * 依赖系统外层大圆；图标放大并严格居中。
 */
export function AppleModalCloseButton() {
  const close = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="关闭"
      hitSlop={10}
      onPress={close}
      style={({ pressed }) => [styles.hit, pressed && styles.pressed]}>
      <View style={styles.centerBox}>
        {Platform.OS === 'ios' ? (
          <SymbolView
            name="xmark"
            size={18}
            weight="bold"
            tintColor="#3A3A3C"
            resizeMode="scaleAspectFit"
            style={styles.symbol}
            fallback={<Ionicons name="close" size={24} color="#3A3A3C" />}
          />
        ) : (
          <Ionicons name="close" size={24} color="#3A3A3C" />
        )}
      </View>
    </Pressable>
  );
}

const HIT = 36;

const styles = StyleSheet.create({
  hit: {
    width: HIT,
    height: HIT,
    marginRight: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.55,
  },
  centerBox: {
    width: HIT,
    height: HIT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbol: {
    width: 18,
    height: 18,
  },
});
