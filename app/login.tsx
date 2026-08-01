import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { Brand, Page, Radius, Spacing, Type } from '@/constants/brand';
import { useAuth } from '@/contexts/auth-context';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    setBusy(true);
    try {
      await login({ phone, password });
      if (router.canDismiss()) {
        router.dismissAll();
      }
      router.replace('/');
    } catch (error) {
      Alert.alert('登录失败', error instanceof Error ? error.message : '请稍后重试');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.page}>
          <Text style={styles.title}>登录</Text>
          <Text style={styles.subtitle}>登录后即可使用 AI 形象测评</Text>

          <View style={styles.card}>
            <Text style={styles.label}>手机号</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="number-pad"
              maxLength={11}
              placeholder="请输入手机号"
              placeholderTextColor={Brand.gray400}
              autoCorrect={false}
            />
            <View style={styles.divider} />
            <Text style={styles.label}>密码</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="请输入密码"
              placeholderTextColor={Brand.gray400}
            />
          </View>

          <AppButton label={busy ? '登录中…' : '登录'} onPress={onSubmit} disabled={busy} />

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>还没有账号？</Text>
            <Link href="/register" asChild>
              <Pressable>
                <Text style={styles.link}>立即注册</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Brand.canvas },
  flex: { flex: 1 },
  page: {
    flex: 1,
    paddingHorizontal: Page.insetWide,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  title: {
    fontSize: Type.largeTitle,
    fontWeight: '700',
    color: Brand.black,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: Type.subhead,
    color: Brand.gray400,
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Brand.white,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: Type.caption,
    color: Brand.gray400,
    marginBottom: 4,
    marginTop: 6,
  },
  input: {
    fontSize: Type.body,
    color: Brand.black,
    paddingVertical: 10,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Brand.hairline,
    marginVertical: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
  },
  footerText: { fontSize: Type.subhead, color: Brand.gray600 },
  link: { fontSize: Type.subhead, color: '#007AFF', fontWeight: '600' },
});
