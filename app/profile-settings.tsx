import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { Brand, Page, Radius, Spacing, Type } from '@/constants/brand';
import { Copy } from '@/constants/copy';
import { useAuth } from '@/contexts/auth-context';
import { cachePickedImage } from '@/services/image-cache';

type EditorKind = 'nickname' | 'phone' | 'password' | null;

/**
 * 我的信息设置：修改头像、名称、手机号、密码（苹果账户风格）
 */
export default function ProfileSettingsScreen() {
  const router = useRouter();
  const { user, updateProfile, changePassword } = useAuth();
  const [editor, setEditor] = useState<EditorKind>(null);
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [baselineNickname, setBaselineNickname] = useState('');
  const [baselinePhone, setBaselinePhone] = useState('');
  const [busy, setBusy] = useState(false);

  const maskedPhone = useMemo(() => {
    if (!user?.phone) return '';
    return user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  }, [user?.phone]);

  const editorDirty = useMemo(() => {
    if (editor === 'nickname') return nickname.trim() !== baselineNickname.trim();
    if (editor === 'phone') return phone.replace(/\D/g, '') !== baselinePhone.replace(/\D/g, '');
    if (editor === 'password') {
      return currentPassword.length > 0 || newPassword.length > 0;
    }
    return false;
  }, [
    baselineNickname,
    baselinePhone,
    currentPassword,
    editor,
    newPassword,
    nickname,
    phone,
  ]);

  if (!user) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>请先登录</Text>
          <AppButton label="去登录" onPress={() => router.replace('/login')} />
        </View>
      </SafeAreaView>
    );
  }

  const openEditor = (kind: EditorKind) => {
    setNickname(user.nickname);
    setPhone(user.phone);
    setBaselineNickname(user.nickname);
    setBaselinePhone(user.phone);
    setCurrentPassword('');
    setNewPassword('');
    setEditor(kind);
  };

  const closeEditor = () => {
    if (busy) return;
    setEditor(null);
  };

  const pickAvatar = async () => {
    const current = await ImagePicker.getMediaLibraryPermissionsAsync();
    let status = current.status;
    if (!current.granted) {
      const asked = await ImagePicker.requestMediaLibraryPermissionsAsync();
      status = asked.status;
    }
    if (status !== 'granted') {
      Alert.alert(Copy.albumPermissionTitle, Copy.albumPermissionBody, [
        { text: Copy.cancel, style: 'cancel' },
        { text: Copy.openSettings, onPress: () => Linking.openSettings() },
      ]);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0]?.uri) return;

    setBusy(true);
    try {
      const uri = await cachePickedImage(result.assets[0].uri);
      await updateProfile({ avatarUri: uri });
    } catch (error) {
      Alert.alert('更新失败', error instanceof Error ? error.message : '请稍后重试');
    } finally {
      setBusy(false);
    }
  };

  const saveEditor = async () => {
    setBusy(true);
    try {
      if (editor === 'nickname') {
        await updateProfile({ nickname });
      } else if (editor === 'phone') {
        await updateProfile({ phone });
      } else if (editor === 'password') {
        await changePassword({ currentPassword, newPassword });
        Alert.alert('已更新', '密码修改成功');
      }
      setEditor(null);
    } catch (error) {
      Alert.alert('保存失败', error instanceof Error ? error.message : '请稍后重试');
    } finally {
      setBusy(false);
    }
  };

  const initial = user.nickname.trim()[0] || '我';

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="更换头像"
            onPress={() => void pickAvatar()}
            disabled={busy}
            style={({ pressed }) => [styles.avatarWrap, pressed && styles.pressed]}>
            {user.avatarUri ? (
              <Image source={{ uri: user.avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>{initial}</Text>
              </View>
            )}
          </Pressable>
          <Pressable
            onPress={() => void pickAvatar()}
            disabled={busy}
            style={({ pressed }) => [
              styles.avatarActionBtn,
              pressed && styles.avatarActionPressed,
              busy && styles.avatarActionDisabled,
            ]}>
            <Text style={styles.avatarActionText}>选取照片</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>个人信息</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="person-outline"
            label="名称"
            value={user.nickname}
            onPress={() => openEditor('nickname')}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="call-outline"
            label="手机号"
            value={maskedPhone}
            onPress={() => openEditor('phone')}
          />
        </View>

        <Text style={styles.sectionLabel}>登录与安全性</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="lock-closed-outline"
            label="修改密码"
            value="定期更新更安全"
            onPress={() => openEditor('password')}
          />
        </View>
      </ScrollView>

      <Modal
        visible={editor !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeEditor}>
        <SafeAreaView style={styles.editSafe} edges={['top', 'left', 'right', 'bottom']}>
          <KeyboardAvoidingView
            style={styles.editFlex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.editHeader}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="关闭"
                disabled={busy}
                onPress={closeEditor}
                style={({ pressed }) => [styles.editCloseBtn, pressed && styles.pressed]}>
                <Ionicons name="close" size={24} color="#3A3A3C" />
              </Pressable>
              <Text style={styles.editTitle}>
                {editor === 'nickname' ? '名称' : editor === 'phone' ? '手机号' : '密码'}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="保存"
                disabled={busy || !editorDirty}
                onPress={() => void saveEditor()}
                style={({ pressed }) => [
                  styles.editDoneBtn,
                  editorDirty ? styles.editDoneBtnActive : styles.editDoneBtnIdle,
                  pressed && editorDirty && styles.pressed,
                  busy && styles.avatarActionDisabled,
                ]}>
                <Ionicons name="checkmark" size={24} color={Brand.white} />
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.editScroll}
              showsVerticalScrollIndicator={false}>
              <View style={styles.editCard}>
                {editor === 'nickname' ? (
                  <EditFieldRow
                    label="名称"
                    autoFocus
                    value={nickname}
                    onChangeText={setNickname}
                    placeholder="请输入名称"
                    maxLength={20}
                  />
                ) : null}

                {editor === 'phone' ? (
                  <EditFieldRow
                    label="手机号"
                    autoFocus
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="请输入手机号"
                    keyboardType="number-pad"
                    maxLength={11}
                  />
                ) : null}

                {editor === 'password' ? (
                  <>
                    <EditFieldRow
                      label="当前密码"
                      autoFocus
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      placeholder="请输入当前密码"
                      secureTextEntry
                    />
                    <View style={styles.editDivider} />
                    <EditFieldRow
                      label="新密码"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="至少 6 位"
                      secureTextEntry
                    />
                  </>
                ) : null}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function EditFieldRow({
  label,
  value,
  onChangeText,
  placeholder,
  autoFocus,
  keyboardType,
  maxLength,
  secureTextEntry,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  keyboardType?: 'default' | 'number-pad';
  maxLength?: number;
  secureTextEntry?: boolean;
}) {
  return (
    <View style={styles.editRow}>
      <Text style={styles.editLabel}>{label}</Text>
      <TextInput
        style={styles.editInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Brand.gray400}
        autoFocus={autoFocus}
        keyboardType={keyboardType}
        maxLength={maxLength}
        secureTextEntry={secureTextEntry}
        autoCorrect={false}
      />
    </View>
  );
}

function SettingsRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={Brand.gray600} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={Brand.gray400} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Brand.canvas,
  },
  scroll: {
    paddingHorizontal: Page.insetWide,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Page.insetWide,
  },
  emptyTitle: {
    fontSize: Type.title,
    fontWeight: '700',
    color: Brand.black,
  },
  hero: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    gap: 6,
  },
  avatarWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: Brand.gray200,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    flex: 1,
    backgroundColor: Brand.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: Brand.white,
    fontSize: 44,
    fontWeight: '700',
  },
  avatarActionBtn: {
    marginTop: 4,
    minHeight: 36,
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: Brand.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Brand.hairline,
  },
  avatarActionPressed: {
    opacity: 0.75,
  },
  avatarActionDisabled: {
    opacity: 0.5,
  },
  avatarActionText: {
    fontSize: Type.subhead,
    color: '#007AFF',
    fontWeight: '600',
  },
  sectionLabel: {
    marginLeft: 4,
    marginBottom: 8,
    fontSize: Type.footnote,
    color: Brand.gray400,
    fontWeight: '600',
  },
  card: {
    backgroundColor: Brand.white,
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  row: {
    minHeight: 52,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowIcon: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: Brand.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontSize: Type.body,
    color: Brand.black,
    fontWeight: '500',
  },
  rowValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: Type.subhead,
    color: Brand.gray400,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Brand.hairline,
    marginLeft: 54,
  },
  pressed: {
    opacity: 0.7,
  },
  editSafe: {
    flex: 1,
    backgroundColor: Brand.canvas,
  },
  editFlex: {
    flex: 1,
  },
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Page.insetWide,
    paddingVertical: Spacing.sm,
  },
  /** 对齐系统导航栏外层玻璃圆观感（比裸 36 更大） */
  editCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Brand.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editDoneBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editDoneBtnIdle: {
    backgroundColor: '#C7C7CC',
  },
  editDoneBtnActive: {
    backgroundColor: '#007AFF',
  },
  editTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Brand.black,
  },
  editScroll: {
    paddingHorizontal: Page.insetWide,
    paddingTop: Spacing.md,
  },
  editCard: {
    backgroundColor: Brand.white,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  editRow: {
    minHeight: 48,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  editLabel: {
    width: 72,
    fontSize: Type.body,
    color: Brand.black,
  },
  editInput: {
    flex: 1,
    fontSize: Type.body,
    color: Brand.black,
    paddingVertical: 14,
  },
  editDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Brand.hairline,
    marginLeft: 72 + Spacing.lg,
  },
});
