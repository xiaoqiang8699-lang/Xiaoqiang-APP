import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { Brand, Radius, Spacing, Type } from '@/constants/brand';

type Variant = 'primary' | 'secondary' | 'plain';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'plain' && styles.plain,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      <Text
        style={[
          styles.label,
          variant === 'primary' && styles.labelOnPrimary,
          variant === 'secondary' && styles.labelOnSecondary,
          variant === 'plain' && styles.labelOnPlain,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: Brand.black,
  },
  secondary: {
    backgroundColor: Brand.white,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: Brand.gray200,
  },
  plain: {
    backgroundColor: 'transparent',
    minHeight: 44,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontSize: Type.callout,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  labelOnPrimary: {
    color: Brand.white,
  },
  labelOnSecondary: {
    color: Brand.black,
  },
  labelOnPlain: {
    color: Brand.gray600,
    fontWeight: '500',
  },
});
