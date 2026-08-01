import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { Brand, Page, Radius, Spacing, Type } from '@/constants/brand';
import { useAuth } from '@/contexts/auth-context';

export default function AccountScreen() {
  const router = useRouter();
  const { user, logout, deleteAccount } = useAuth();
  const [busy, setBusy] = useState(false);

  if (!user) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
        <View style={styles.page}>
          <View style={styles.profileCard}>
            <View style={styles.guestAvatar}>
              <Ionicons name="person" size={28} color={Brand.gray400} />
            </View>
            <View style={styles.profileText}>
              <Text style={styles.name}>未登录</Text>
              <Text style={styles.hint}>登录后可使用 AI 形象测评</Text>
            </View>
          </View>

          <AppButton label="登录" onPress={() => router.push('/login')} />
          <AppButton
            label="注册新账号"
            variant="secondary"
            onPress={() => router.push('/register')}
          />

          <View style={styles.listCard}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/legal/privacy')}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
              <Text style={styles.rowLabel}>隐私政策</Text>
              <Ionicons name="chevron-forward" size={16} color={Brand.gray400} />
            </Pressable>
            <View style={styles.hairline} />
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/legal/terms')}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
              <Text style={styles.rowLabel}>用户协议</Text>
              <Ionicons name="chevron-forward" size={16} color={Brand.gray400} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const onLogout = () => {
    Alert.alert('退出登录', '确定要退出当前账号吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '退出',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/');
        },
      },
    ]);
  };

  const onDeleteAccount = () => {
    Alert.alert(
      '删除账号',
      '将永久删除本机账号资料与穿搭历史，且不可恢复。确定继续？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除账号',
          style: 'destructive',
          onPress: () => {
            Alert.alert('再次确认', '删除后无法找回，是否仍要删除？', [
              { text: '取消', style: 'cancel' },
              {
                text: '确认删除',
                style: 'destructive',
                onPress: async () => {
                  setBusy(true);
                  try {
                    await deleteAccount();
                    if (router.canDismiss()) router.dismissAll();
                    router.replace('/');
                  } catch (error) {
                    Alert.alert(
                      '删除失败',
                      error instanceof Error ? error.message : '请稍后重试',
                    );
                  } finally {
                    setBusy(false);
                  }
                },
              },
            ]);
          },
        },
      ],
    );
  };

  const initial = user.nickname.trim()[0] || '我';
  const maskedPhone = user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <View style={styles.page}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="账户信息与设置"
          onPress={() => router.push('/profile-settings')}
          style={({ pressed }) => [styles.profileCard, pressed && styles.pressed]}>
          {user.avatarUri ? (
            <Image source={{ uri: user.avatarUri }} style={styles.userAvatarImage} />
          ) : (
            <View style={styles.userAvatar}>
              <Text style={styles.initial}>{initial}</Text>
            </View>
          )}
          <View style={styles.profileText}>
            <Text style={styles.name}>{user.nickname}</Text>
            <Text style={styles.hint}>账户信息与设置</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Brand.gray400} />
        </Pressable>

        <View style={styles.listCard}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>手机号</Text>
            <Text style={styles.rowValue}>{maskedPhone}</Text>
          </View>
          <View style={styles.hairline} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>账户状态</Text>
            <Text style={styles.rowValue}>标准账户</Text>
          </View>
        </View>

        <View style={styles.listCard}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/legal/privacy')}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            <Text style={styles.rowLabel}>隐私政策</Text>
            <Ionicons name="chevron-forward" size={16} color={Brand.gray400} />
          </Pressable>
          <View style={styles.hairline} />
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/legal/terms')}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            <Text style={styles.rowLabel}>用户协议</Text>
            <Ionicons name="chevron-forward" size={16} color={Brand.gray400} />
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="删除账号"
          disabled={busy}
          onPress={onDeleteAccount}
          style={({ pressed }) => [styles.deleteBtn, pressed && styles.logoutPressed]}>
          <Text style={styles.deleteText}>{busy ? '删除中…' : '删除账号'}</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="退出登录"
          disabled={busy}
          onPress={onLogout}
          style={({ pressed }) => [styles.logoutBtn, pressed && styles.logoutPressed]}>
          <Text style={styles.logoutText}>退出登录</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Brand.canvas },
  page: {
    flex: 1,
    paddingHorizontal: Page.insetWide,
    paddingTop: Spacing.md,
    paddingBottom: Page.bottomExtra,
    gap: Spacing.md,
  },
  profileCard: {
    backgroundColor: Brand.white,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  pressed: { opacity: 0.85 },
  guestAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Brand.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Brand.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Brand.gray200,
  },
  initial: {
    color: Brand.white,
    fontSize: 22,
    fontWeight: '700',
  },
  profileText: { flex: 1 },
  name: {
    fontSize: Type.headline,
    fontWeight: '700',
    color: Brand.black,
  },
  hint: {
    marginTop: 4,
    fontSize: Type.footnote,
    color: Brand.gray400,
  },
  listCard: {
    backgroundColor: Brand.white,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
  },
  row: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: { fontSize: Type.body, color: Brand.black },
  rowValue: { fontSize: Type.subhead, color: Brand.gray600 },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Brand.hairline,
  },
  deleteBtn: {
    minHeight: 50,
    borderRadius: 999,
    backgroundColor: Brand.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    fontSize: Type.callout,
    fontWeight: '600',
    color: '#FF3B30',
  },
  logoutBtn: {
    marginTop: 'auto',
    minHeight: 50,
    borderRadius: 999,
    backgroundColor: Brand.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutPressed: {
    opacity: 0.72,
  },
  logoutText: {
    fontSize: Type.callout,
    fontWeight: '600',
    color: '#FF3B30',
  },
});
