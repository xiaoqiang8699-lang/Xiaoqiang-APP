import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppleMoreButton } from '@/components/apple-more-button';
import { AppButton } from '@/components/app-button';
import { DimensionScorePanel } from '@/components/dimension-score-panel';
import { ZoomableImage } from '@/components/zoomable-image';
import { Brand, Page, Radius, Spacing, Type } from '@/constants/brand';
import { Copy } from '@/constants/copy';
import { useAuth } from '@/contexts/auth-context';
import { deleteHistoryItem } from '@/services/history-store';
import {
  clearAnalysisSession,
  getAnalysisSession,
  setAnalysisImage,
} from '@/stores/analysis-store';
import type { AIAnalysisResult } from '@/types/analysis';

export default function ResultScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const session = getAnalysisSession();
      setImageUri(session.imageUri);
      setResult(session.result);
      setHistoryId(session.historyId);
    }, []),
  );

  /** 形象报告返回：始终回到首页，避免卡在测评中间页 */
  const goBackToEntry = useCallback(() => {
    router.replace('/');
  }, [router]);

  const goHomeFresh = useCallback(() => {
    clearAnalysisSession();
    router.replace('/');
  }, [router]);

  const confirmDelete = useCallback(() => {
    if (!user || !historyId || deleting) {
      Alert.alert('无法删除', '未找到对应的历史记录');
      return;
    }

    Alert.alert('删除形象报告', '删除后无法恢复，确定要删除这条记录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setDeleting(true);
            try {
              await deleteHistoryItem(user.id, historyId);
              clearAnalysisSession();
              router.replace('/');
            } catch {
              Alert.alert('删除失败', '请稍后重试');
            } finally {
              setDeleting(false);
            }
          })();
        },
      },
    ]);
  }, [deleting, historyId, router, user]);

  /** 用当前报告照片进入测评页重新分析 */
  const retrySamePhoto = useCallback(() => {
    if (!user) {
      Alert.alert('需要登录', '登录后才能重新测评');
      return;
    }
    if (!imageUri) {
      Alert.alert('无法再测', '未找到历史照片');
      return;
    }
    setAnalysisImage(imageUri);
    router.replace('/analyzing');
  }, [imageUri, router, user]);

  const moreActions = useMemo(
    () => [
      {
        key: 'delete',
        label: deleting ? '删除中…' : '删除报告',
        icon: 'trash-outline' as const,
        destructive: true,
        disabled: deleting || !historyId,
        onPress: confirmDelete,
      },
    ],
    [confirmDelete, deleting, historyId],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerBackVisible: false,
      gestureEnabled: true,
      headerLeft: () => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={Copy.back}
          onPress={goBackToEntry}
          hitSlop={10}
          style={({ pressed }) => [styles.backHit, pressed && styles.backPressed]}>
          <Ionicons name="chevron-back" size={28} color={Brand.black} />
          <Text style={styles.backText}>{Copy.back}</Text>
        </Pressable>
      ),
      headerRight: () => <AppleMoreButton actions={moreActions} />,
    });
  }, [goBackToEntry, moreActions, navigation]);

  if (!result) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>{Copy.noResultTitle}</Text>
          <Text style={styles.emptyBody}>{Copy.noResultBody}</Text>
          <AppButton label={Copy.goHome} onPress={goHomeFresh} style={styles.emptyBtn} />
        </View>
      </SafeAreaView>
    );
  }

  if (!result.is_valid) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
        <View style={styles.bodyWrap}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}>
            {imageUri ? (
              <ZoomableImage
                uri={imageUri}
                style={styles.hero}
                accessibilityLabel="查看穿搭大图"
              />
            ) : null}
            <View style={styles.card}>
              <Text style={styles.cardEyebrow}>{Copy.gentleReminder}</Text>
              <Text style={styles.praise}>{result.praise}</Text>
            </View>
          </ScrollView>
          <View style={styles.footer}>
            <AppButton
              label={Copy.retry}
              onPress={retrySamePhoto}
              disabled={!imageUri}
            />
            <AppButton label={Copy.reupload} variant="plain" onPress={goHomeFresh} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <View style={styles.bodyWrap}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}>
          <View style={styles.scoreSection}>
            <DimensionScorePanel imageUri={imageUri} dimensions={result.dimensions} />
          </View>

          <View style={styles.group}>
            <View style={styles.card}>
              <Text style={styles.cardEyebrow}>{Copy.praiseTitle}</Text>
              <Text style={styles.praise}>{result.praise}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardEyebrow}>{Copy.analysisTitle}</Text>
              <Text style={styles.body}>{result.analysis}</Text>
            </View>

            <View style={[styles.card, styles.cardLast]}>
              <Text style={styles.cardEyebrow}>{Copy.adviceTitle}</Text>
              {result.advice.map((item, index) => (
                <View
                  key={item}
                  style={[
                    styles.adviceRow,
                    index < result.advice.length - 1 && styles.adviceDivider,
                  ]}>
                  <View style={styles.adviceIndex}>
                    <Text style={styles.adviceIndexText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.adviceText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <AppButton
            label={Copy.retry}
            onPress={retrySamePhoto}
            disabled={!imageUri}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Brand.canvas,
  },
  bodyWrap: {
    flex: 1,
  },
  backHit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -6,
    paddingRight: 6,
  },
  backPressed: {
    opacity: 0.55,
  },
  backText: {
    fontSize: 17,
    color: Brand.black,
    marginLeft: -4,
  },
  scroll: {
    paddingHorizontal: Page.insetWide,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  scoreSection: {
    marginBottom: Spacing.lg,
  },
  hero: {
    width: '100%',
    height: 200,
    borderRadius: Radius.lg,
    backgroundColor: Brand.gray200,
    marginBottom: Spacing.md,
  },
  group: {
    gap: Spacing.sm,
  },
  card: {
    backgroundColor: Brand.white,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    gap: 8,
  },
  cardLast: {
    marginBottom: Spacing.sm,
  },
  cardEyebrow: {
    fontSize: Type.caption,
    fontWeight: '600',
    color: Brand.gray400,
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  praise: {
    fontSize: Type.body,
    lineHeight: 26,
    color: Brand.black,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  body: {
    fontSize: Type.subhead,
    lineHeight: 24,
    color: Brand.gray800,
    letterSpacing: -0.1,
  },
  adviceRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
    paddingVertical: 6,
  },
  adviceDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.hairline,
    paddingBottom: 12,
    marginBottom: 4,
  },
  adviceIndex: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Brand.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  adviceIndexText: {
    fontSize: 12,
    fontWeight: '700',
    color: Brand.black,
  },
  adviceText: {
    flex: 1,
    fontSize: Type.subhead,
    lineHeight: 23,
    color: Brand.gray800,
  },
  footer: {
    paddingHorizontal: Page.insetWide,
    paddingTop: Spacing.sm,
    paddingBottom: Page.bottomExtra,
    backgroundColor: Brand.canvas,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.hairline,
    gap: Spacing.xs,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Page.insetWide,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Type.title,
    fontWeight: '700',
    color: Brand.black,
    letterSpacing: 0.2,
  },
  emptyBody: {
    fontSize: Type.subhead,
    color: Brand.gray400,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  emptyBtn: {
    alignSelf: 'stretch',
  },
});
