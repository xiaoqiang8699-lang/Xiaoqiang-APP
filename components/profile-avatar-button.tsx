import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/brand';
import type { AuthUser } from '@/types/auth';

type Props = {
  user: AuthUser | null;
  onPress: () => void;
  size?: number;
};

/**
 * App Store 风格右上角圆形头像入口
 */
export function ProfileAvatarButton({ user, onPress, size = 36 }: Props) {
  const initial = user?.nickname?.trim()?.[0] || '';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={user ? '我的账户' : '登录或注册'}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.wrap,
        { width: size, height: size, borderRadius: size / 2 },
        pressed && styles.pressed,
      ]}>
      {user ? (
        user.avatarUri ? (
          <Image
            source={{ uri: user.avatarUri }}
            style={{ width: size, height: size, borderRadius: size / 2 }}
          />
        ) : (
          <View style={[styles.avatar, { borderRadius: size / 2 }]}>
            <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{initial}</Text>
          </View>
        )
      ) : (
        <View style={[styles.guest, { borderRadius: size / 2 }]}>
          <Ionicons name="person" size={size * 0.48} color={Brand.gray400} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  avatar: {
    flex: 1,
    backgroundColor: Brand.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: Brand.white,
    fontWeight: '700',
  },
  guest: {
    flex: 1,
    backgroundColor: Brand.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
