import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, Page, Spacing, Type } from '@/constants/brand';

type Props = {
  title: string;
  body: string;
};

/**
 * 法律文档滚动阅读页（隐私政策 / 用户协议）
 */
export function LegalDocumentScreen({ title, body }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Brand.canvas },
  content: {
    paddingHorizontal: Page.insetWide,
    paddingTop: Spacing.md,
    paddingBottom: Page.bottomExtra + Spacing.xl,
  },
  title: {
    fontSize: Type.title,
    fontWeight: '700',
    color: Brand.black,
    marginBottom: Spacing.md,
  },
  body: {
    fontSize: Type.subhead,
    lineHeight: 22,
    color: Brand.gray600,
  },
});
