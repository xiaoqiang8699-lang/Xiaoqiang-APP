import { Ionicons } from '@expo/vector-icons';
import { SymbolView } from 'expo-symbols';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  onPress: () => void;
  accessibilityLabel: string;
};

/**
 * 仿 iOS 相机翻转按钮：圆形毛玻璃底 + 双向环形箭头，点击旋转反馈。
 */
export function FlipCameraButton({ onPress, accessibilityLabel }: Props) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.82, { duration: 80, easing: Easing.out(Easing.quad) }),
      withTiming(1.06, { duration: 160, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 140, easing: Easing.out(Easing.cubic) }),
    );
    rotation.value = withTiming(rotation.value + 180, {
      duration: 480,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={10}
      onPress={handlePress}
      style={({ pressed }) => [styles.hit, pressed && styles.hitPressed]}>
      <View style={styles.circle}>
        <Animated.View style={iconStyle}>
          {Platform.OS === 'ios' ? (
            <SymbolView
              name="arrow.triangle.2.circlepath"
              size={28}
              tintColor="#FFFFFF"
              weight="medium"
              resizeMode="scaleAspectFit"
              fallback={<Ionicons name="sync" size={26} color="#FFFFFF" />}
            />
          ) : (
            <Ionicons name="sync" size={26} color="#FFFFFF" />
          )}
        </Animated.View>
      </View>
    </Pressable>
  );
}

const SIZE = 48;

const styles = StyleSheet.create({
  hit: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hitPressed: {
    opacity: 0.85,
  },
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    // iOS 相机控件常见深色半透明圆
    backgroundColor: 'rgba(58, 58, 60, 0.55)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
