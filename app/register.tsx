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

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (!agreed) {
      Alert.alert('请先同意协议', '注册前需阅读并同意《用户协议》与《隐私政策》');
      return;
    }
    setBusy(true);
    try {
      await register({ nickname, phone, password });
      if (router.canDismiss()) {
        router.dismissAll();
      }
      router.replace('/');
    } catch (error) {
      Alert.alert('注册失败', error instanceof Error ? error.message : '请稍后重试');
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
          <Text style={styles.title}>创建账户</Text>
          <Text style={styles.subtitle}>注册后解锁 AI 形象测评</Text>

          <View style={styles.card}>
            <Text style={styles.label}>昵称</Text>
            <TextInput
              style={styles.input}
              value={nickname}
              onChangeText={setNickname}
              placeholder="怎么称呼你"
              placeholderTextColor={Brand.gray400}
              maxLength={20}
            />
            <View style={styles.divider} />
            <Text style={styles.label}>手机号</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="number-pad"
              maxLength={11}
              placeholder="请输入手机号"
              placeholderTextColor={Brand.gray400}
            />
            <View style={styles.divider} />
            <Text style={styles.label}>密码</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="至少 6 位"
              placeholderTextColor={Brand.gray400}
            />
          </View>

          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreed }}
            onPress={() => setAgreed((v) => !v)}
            style={styles.agreeRow}>
            <View style={[styles.checkbox, agreed && styles.checkboxOn]}>
              {agreed ? <Text style={styles.checkmark}>✓</Text> : null}
            </View>
            <Text style={styles.agreeText}>
              我已阅读并同意
              <Text
                style={styles.legalLink}
                onPress={() => router.push('/legal/terms')}>
                《用户协议》
              </Text>
              与
              <Text
                style={styles.legalLink}
                onPress={() => router.push('/legal/privacy')}>
                《隐私政策》
              </Text>
            </Text>
          </Pressable>

          <AppButton
            label={busy ? '创建中…' : '注册并登录'}
            onPress={onSubmit}
            disabled={busy || !agreed}
          />

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>已有账号？</Text>
            <Link href="/login" asChild>
              <Pressable>
                <Text style={styles.link}>去登录</Text>
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
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingRight: Spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Brand.gray300,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxOn: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkmark: {
    color: Brand.white,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
  agreeText: {
    flex: 1,
    fontSize: Type.footnote,
    color: Brand.gray600,
    lineHeight: 20,
  },
  legalLink: {
    color: '#007AFF',
    fontWeight: '600',
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
