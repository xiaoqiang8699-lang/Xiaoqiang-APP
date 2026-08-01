import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import {
  HISTORY_CARD_HEIGHT,
  HISTORY_CARD_WIDTH,
  HistoryStrip,
} from '@/components/history-strip';
import { ProfileAvatarButton } from '@/components/profile-avatar-button';
import { Brand, Page, Radius, Spacing, Type } from '@/constants/brand';
import { Copy } from '@/constants/copy';
import { useAuth } from '@/contexts/auth-context';
import { deleteHistoryItems } from '@/services/history-store';
import { cachePickedImage } from '@/services/image-cache';
import { setAnalysisImage } from '@/stores/analysis-store';
import type { HomePhase } from '@/types/analysis';
import type { HistoryItem } from '@/types/history';

/** 对齐 App Store「Today」右上角头像尺寸 */
const HEADER_AVATAR_SIZE = 40;

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ photoUri?: string | string[] }>();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [phase, setPhase] = useState<HomePhase>('empty');
  const [historyKey, setHistoryKey] = useState(0);
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      const raw = params.photoUri;
      const uri = Array.isArray(raw) ? raw[0] : raw;
      if (uri) {
        setImageUri(uri);
        setAnalysisImage(uri);
        setPhase('preview');
        router.setParams({ photoUri: undefined });
      }
      setHistoryKey((k) => k + 1);
      setSelecting(false);
      setSelectedIds([]);
    }, [params.photoUri, router]),
  );

  const ensureLoggedIn = useCallback(() => {
    if (user) return true;
    Alert.alert('需要登录', '登录后才能使用 AI 形象测评功能', [
      { text: '取消', style: 'cancel' },
      { text: '去登录', onPress: () => router.push('/login') },
      { text: '注册', onPress: () => router.push('/register') },
    ]);
    return false;
  }, [router, user]);

  const ensureLibraryPermission = useCallback(async () => {
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
      return false;
    }
    return true;
  }, []);

  const applyPickedUri = useCallback(async (uri: string) => {
    const cached = await cachePickedImage(uri);
    setImageUri(cached);
    setAnalysisImage(cached);
    setPhase('preview');
  }, []);

  const pickFromLibrary = useCallback(async () => {
    if (!ensureLoggedIn()) return;
    const ok = await ensureLibraryPermission();
    if (!ok) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      await applyPickedUri(result.assets[0].uri);
    }
  }, [applyPickedUri, ensureLibraryPermission, ensureLoggedIn]);

  const openCamera = useCallback(() => {
    if (!ensureLoggedIn()) return;
    if (Platform.OS === 'web') {
      Alert.alert(Copy.tip, Copy.webCameraUnsupported);
      return;
    }
    router.push('/camera');
  }, [ensureLoggedIn, router]);

  const openSourcePicker = useCallback(() => {
    if (selecting) return;
    if (!ensureLoggedIn()) return;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['取消', Copy.takePhoto, Copy.pickAlbum],
          cancelButtonIndex: 0,
        },
        (index) => {
          if (index === 1) openCamera();
          if (index === 2) void pickFromLibrary();
        },
      );
      return;
    }

    Alert.alert('添加穿搭照片', '请选择图片来源', [
      { text: Copy.cancel, style: 'cancel' },
      { text: Copy.takePhoto, onPress: openCamera },
      { text: Copy.pickAlbum, onPress: () => void pickFromLibrary() },
    ]);
  }, [ensureLoggedIn, openCamera, pickFromLibrary, selecting]);

  const startAnalysis = useCallback(() => {
    if (!ensureLoggedIn() || !user) return;
    if (!imageUri) return;

    setAnalysisImage(imageUri);
    router.push('/analyzing');
  }, [ensureLoggedIn, imageUri, router, user]);

  const enterSelectMode = useCallback(() => {
    if (!ensureLoggedIn()) return;
    if (historyItems.length === 0) {
      Alert.alert('暂无记录', '完成测评后即可批量选择历史记录');
      return;
    }
    setSelecting(true);
    setSelectedIds([]);
  }, [ensureLoggedIn, historyItems.length]);

  const exitSelectMode = useCallback(() => {
    setSelecting(false);
    setSelectedIds([]);
  }, []);

  const toggleSelect = useCallback((item: HistoryItem) => {
    setSelectedIds((prev) =>
      prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id],
    );
  }, []);

  const selectedItems = useMemo(
    () => historyItems.filter((item) => selectedIds.includes(item.id)),
    [historyItems, selectedIds],
  );

  const handleDeleteSelected = useCallback(() => {
    if (!user || selectedIds.length === 0) return;

    Alert.alert(
      '删除所选记录',
      `确定删除已选的 ${selectedIds.length} 条历史记录吗？删除后无法恢复。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deleteHistoryItems(user.id, selectedIds);
                setHistoryKey((k) => k + 1);
                exitSelectMode();
              } catch {
                Alert.alert('删除失败', '请稍后重试');
              }
            })();
          },
        },
      ],
    );
  }, [exitSelectMode, selectedIds, user]);

  const handleShareSelected = useCallback(async () => {
    if (selectedItems.length === 0) return;

    try {
      const uris = selectedItems.map((item) => item.imageUri).filter(Boolean);
      if (uris.length === 0) {
        Alert.alert('无法分享', '所选记录没有可分享的照片');
        return;
      }

      if (Platform.OS === 'ios' && uris.length > 1) {
        await Share.share({
          // RN 类型未声明 urls，iOS 实际支持多图分享
          url: uris[0],
          message: `来自 AI形象重塑 的穿搭测评（共 ${uris.length} 张）`,
          urls: uris,
        } as Parameters<typeof Share.share>[0]);
      } else {
        await Share.share({
          url: uris[0],
          message:
            selectedItems.length > 1
              ? `来自 AI形象重塑 的穿搭测评（共 ${selectedItems.length} 张，当前分享第 1 张）`
              : '来自 AI形象重塑 的穿搭测评',
        });
      }
    } catch {
      // 用户取消分享不提示
    }
  }, [selectedItems]);

  const onItemsChange = useCallback((items: HistoryItem[]) => {
    setHistoryItems(items);
  }, []);

  const empty = phase === 'empty' || !imageUri;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{Copy.appName}</Text>
            <Text style={styles.subtitle}>{Copy.homeSubtitle}</Text>
          </View>
          <View style={styles.headerActions}>
            {selecting ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="取消选择"
                onPress={exitSelectMode}
                style={({ pressed }) => [styles.selectPill, pressed && styles.pillPressed]}>
                <Ionicons name="close" size={18} color={Brand.black} />
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="选择"
                onPress={enterSelectMode}
                style={({ pressed }) => [styles.selectPill, pressed && styles.pillPressed]}>
                <Text style={styles.selectPillText}>选择</Text>
              </Pressable>
            )}
            <ProfileAvatarButton
              user={user}
              size={HEADER_AVATAR_SIZE}
              onPress={() => {
                if (selecting) return;
                router.push('/account');
              }}
            />
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <HistoryStrip
            key={historyKey}
            userId={user?.id}
            selecting={selecting}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onItemsChange={onItemsChange}
            leading={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="添加穿搭照片"
                onPress={empty && !selecting ? openSourcePicker : undefined}
                style={({ pressed }) => [
                  styles.addCard,
                  selecting && styles.addCardDimmed,
                  pressed && empty && !selecting && styles.addCardPressed,
                ]}>
                {imageUri ? (
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.addPreview}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.addPlaceholder}>
                    <View style={styles.plusCircle}>
                      <Ionicons name="camera-outline" size={20} color={Brand.gray400} />
                    </View>
                    <Text style={styles.addTitle}>添加穿搭</Text>
                    <Text style={styles.addHint}>拍照或相册</Text>
                  </View>
                )}
              </Pressable>
            }
          />
        </ScrollView>

        {selecting ? (
          <View style={styles.selectBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="分享"
              disabled={selectedIds.length === 0}
              onPress={() => void handleShareSelected()}
              style={({ pressed }) => [
                styles.selectBarBtn,
                selectedIds.length === 0 && styles.selectBarBtnDisabled,
                pressed && selectedIds.length > 0 && styles.pillPressed,
              ]}>
              <Ionicons
                name="share-outline"
                size={22}
                color={selectedIds.length === 0 ? Brand.gray400 : Brand.black}
              />
            </Pressable>

            <Text style={styles.selectBarLabel}>
              {selectedIds.length === 0
                ? '选择项目'
                : `已选择 ${selectedIds.length} 项`}
            </Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="删除"
              disabled={selectedIds.length === 0}
              onPress={handleDeleteSelected}
              style={({ pressed }) => [
                styles.selectBarBtn,
                selectedIds.length === 0 && styles.selectBarBtnDisabled,
                pressed && selectedIds.length > 0 && styles.pillPressed,
              ]}>
              <Ionicons
                name="trash-outline"
                size={22}
                color={selectedIds.length === 0 ? Brand.gray400 : '#FF3B30'}
              />
            </Pressable>
          </View>
        ) : (
          <View style={styles.actions}>
            {empty ? (
              <Text style={styles.tip}>
                {user ? '点击添加卡片上传今日穿搭照片' : '登录后即可开始 AI 形象测评'}
              </Text>
            ) : (
              <>
                <AppButton label={Copy.startAnalyze} onPress={startAnalysis} />
                <AppButton
                  label={Copy.reselect}
                  variant="plain"
                  onPress={openSourcePicker}
                />
              </>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Brand.canvas,
  },
  page: {
    flex: 1,
    paddingHorizontal: Page.insetWide,
    paddingTop: Spacing.sm,
    paddingBottom: Page.bottomExtra,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  headerText: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 2,
  },
  selectPill: {
    height: HEADER_AVATAR_SIZE,
    minWidth: HEADER_AVATAR_SIZE,
    paddingHorizontal: 16,
    borderRadius: HEADER_AVATAR_SIZE / 2,
    backgroundColor: Brand.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  selectPillText: {
    fontSize: 16,
    fontWeight: '600',
    color: Brand.black,
  },
  pillPressed: {
    opacity: 0.7,
  },
  title: {
    fontSize: Type.largeTitle,
    fontWeight: '700',
    color: Brand.black,
    letterSpacing: 0.35,
  },
  subtitle: {
    marginTop: 6,
    fontSize: Type.subhead,
    lineHeight: 20,
    color: Brand.gray400,
    letterSpacing: -0.1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.md,
  },
  addCard: {
    width: HISTORY_CARD_WIDTH,
    height: HISTORY_CARD_HEIGHT,
    borderRadius: Radius.lg,
    backgroundColor: Brand.white,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Brand.hairline,
    shadowColor: Brand.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  addCardDimmed: {
    opacity: 0.45,
  },
  addCardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  addPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
    gap: 6,
  },
  plusCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.gray100,
    marginBottom: 2,
  },
  addTitle: {
    fontSize: Type.footnote,
    fontWeight: '600',
    color: Brand.black,
  },
  addHint: {
    fontSize: 10,
    color: Brand.gray400,
  },
  addPreview: {
    width: '100%',
    height: '100%',
  },
  actions: {
    gap: Spacing.xs,
    paddingTop: Spacing.md,
  },
  tip: {
    textAlign: 'center',
    fontSize: Type.footnote,
    color: Brand.gray400,
    paddingVertical: Spacing.md,
  },
  selectBar: {
    marginTop: Spacing.sm,
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.94)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  selectBarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.gray100,
  },
  selectBarBtnDisabled: {
    opacity: 0.55,
  },
  selectBarLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: Type.subhead,
    fontWeight: '600',
    color: Brand.black,
  },
});
