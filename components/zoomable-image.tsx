import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  uri: string;
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  accessibilityLabel?: string;
};

/**
 * 可点击缩略图：全屏放大查看，点空白或关闭按钮退出。
 */
export function ZoomableImage({
  uri,
  style,
  resizeMode = 'cover',
  accessibilityLabel = '查看大图',
}: Props) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.thumbWrap,
          style as StyleProp<ViewStyle>,
          pressed && styles.pressed,
        ]}>
        <Image source={{ uri }} style={styles.thumbImage} resizeMode={resizeMode} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <Image source={{ uri }} style={styles.full} resizeMode="contain" />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="关闭"
            onPress={() => setOpen(false)}
            style={[styles.close, { top: insets.top + 8 }]}
            hitSlop={12}>
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  thumbWrap: {
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  pressed: {
    opacity: 0.88,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  full: {
    width: '100%',
    height: '80%',
  },
  close: {
    position: 'absolute',
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
