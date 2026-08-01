import { CommonActions } from '@react-navigation/native';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnalysisOverlay } from '@/components/analysis-overlay';
import { Brand, Page, Radius, Spacing, Type } from '@/constants/brand';
import { Copy } from '@/constants/copy';
import { useAuth } from '@/contexts/auth-context';
import { analyzeOutfit } from '@/services/analyze-outfit';
import { addHistoryItem } from '@/services/history-store';
import {
  getAnalysisSession,
  setAnalysisHistoryId,
  setAnalysisResult,
} from '@/stores/analysis-store';

/** 防止开发态 Strict Mode 重复触发 */
let analyzingJobId = 0;

/**
 * 独立测评交互页：全幅照片 + 扫描动效，完成后进入形象报告。
 */
export default function AnalyzingScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const [imageUri, setImageUri] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const session = getAnalysisSession();
      setImageUri(session.imageUri);
    }, []),
  );

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: false, headerBackVisible: false });
  }, [navigation]);

  useEffect(() => {
    const uri = getAnalysisSession().imageUri;
    if (!uri) {
      Alert.alert(Copy.analyzingFailTitle, '未找到待测评照片', [
        { text: '返回', onPress: () => router.replace('/') },
      ]);
      return;
    }
    if (!user) {
      Alert.alert('需要登录', '登录后才能使用 AI 形象测评', [
        { text: '返回', onPress: () => router.replace('/') },
      ]);
      return;
    }

    setImageUri(uri);
    setAnalysisResult(null);

    const jobId = ++analyzingJobId;

    void (async () => {
      try {
        const result = await analyzeOutfit(uri);
        if (jobId !== analyzingJobId) return;
        setAnalysisResult(result);
        const saved = await addHistoryItem({
          userId: user.id,
          imageUri: uri,
          result,
        });
        if (jobId !== analyzingJobId) return;
        setAnalysisHistoryId(saved.id);
        // 重置栈：首页 → 报告，避免返回落到无返回键的测评页
        navigation.dispatch(
          CommonActions.reset({
            index: 1,
            routes: [{ name: 'index' }, { name: 'result' }],
          }),
        );
      } catch (error) {
        if (jobId !== analyzingJobId) return;
        const message =
          error instanceof Error && error.message
            ? error.message
            : Copy.analyzingFailBody;
        Alert.alert(Copy.analyzingFailTitle, message, [
          {
            text: '返回',
            onPress: () => router.replace('/'),
          },
        ]);
      }
    })();

    return () => {
      if (jobId === analyzingJobId) {
        analyzingJobId += 1;
      }
    };
  }, [navigation, router, user]);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <View style={styles.page}>
        <Text style={styles.eyebrow}>AI 形象测评</Text>
        <Text style={styles.title}>正在解读你的穿搭</Text>
        <Text style={styles.hint}>稍候片刻，专属形象密码马上揭晓</Text>

        <View style={styles.stage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.photo} resizeMode="cover" />
          ) : (
            <View style={[styles.photo, styles.photoPlaceholder]} />
          )}
          <AnalysisOverlay visible />
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
  page: {
    flex: 1,
    paddingHorizontal: Page.insetWide,
    paddingTop: Spacing.md,
    paddingBottom: Page.bottomExtra,
  },
  eyebrow: {
    fontSize: Type.caption,
    fontWeight: '600',
    color: Brand.gray400,
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  title: {
    fontSize: Type.title,
    fontWeight: '700',
    color: Brand.black,
    letterSpacing: -0.2,
  },
  hint: {
    marginTop: 6,
    fontSize: Type.subhead,
    color: Brand.gray400,
    marginBottom: Spacing.lg,
  },
  stage: {
    flex: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Brand.gray200,
    minHeight: 360,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    backgroundColor: Brand.gray200,
  },
});
