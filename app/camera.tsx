import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FlipCameraButton } from '@/components/flip-camera-button';
import { Brand, Page, Radius, Spacing, Type } from '@/constants/brand';
import { Copy } from '@/constants/copy';
import { cachePickedImage } from '@/services/image-cache';
import { setAnalysisImage } from '@/stores/analysis-store';

type Facing = 'front' | 'back';

export default function CameraScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<Facing>('back');
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleFlip = () => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setFacing((f) => (f === 'back' ? 'front' : 'back'));
  };

  if (!permission) {
    return <View style={styles.black} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionSafe} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.permissionBox}>
          <Text style={styles.permissionTitle}>{Copy.cameraPermissionTitle}</Text>
          <Text style={styles.permissionBody}>
            {permission.canAskAgain ? Copy.cameraPermissionBody : Copy.cameraPermissionDenied}
          </Text>
          {permission.canAskAgain ? (
            <Pressable style={styles.lightPrimaryBtn} onPress={requestPermission}>
              <Text style={styles.lightPrimaryBtnText}>{Copy.enableCameraPermission}</Text>
            </Pressable>
          ) : null}
          <Pressable style={styles.lightSecondaryBtn} onPress={() => router.back()}>
            <Text style={styles.lightSecondaryBtnText}>{Copy.cancel}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const takePhoto = async () => {
    if (!cameraRef.current || busy) return;
    setBusy(true);
    try {
      if (Platform.OS !== 'web') {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });
      if (photo?.uri) {
        setPreviewUri(photo.uri);
      }
    } finally {
      setBusy(false);
    }
  };

  const confirmPhoto = async () => {
    if (!previewUri || busy) return;
    setBusy(true);
    try {
      const cached = await cachePickedImage(previewUri);
      setAnalysisImage(cached);
      // 关闭拍照页并直接进入测评，不再回首页二次确认
      router.replace('/analyzing');
    } finally {
      setBusy(false);
    }
  };

  if (previewUri) {
    return (
      <View style={styles.black}>
        <Image source={{ uri: previewUri }} style={styles.preview} resizeMode="cover" />
        <SafeAreaView edges={['bottom']} style={styles.previewBarSafe}>
          <View style={styles.previewBar}>
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => setPreviewUri(null)}
              disabled={busy}>
              <Text style={styles.secondaryBtnText}>{Copy.cameraRetake}</Text>
            </Pressable>
            <Pressable
              style={[styles.primaryBtn, busy && styles.primaryBtnDisabled]}
              onPress={() => void confirmPhoto()}
              disabled={busy}>
              <Text style={styles.primaryBtnText}>
                {busy ? '准备中…' : Copy.startAnalyze}
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.cameraRoot}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} />
      <SafeAreaView style={styles.overlay} edges={['bottom', 'left', 'right']}>
        <View style={styles.hintWrap}>
          <Text style={styles.hint}>{Copy.cameraHint}</Text>
        </View>

        <View style={styles.bottomBar}>
          <View style={styles.controlsRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={Copy.cancel}
              hitSlop={8}
              style={({ pressed }) => [styles.sideBtn, pressed && styles.sideBtnPressed]}
              onPress={() => router.back()}>
              <Ionicons name="close" size={26} color={Brand.white} />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={Copy.cameraCapture}
              style={({ pressed }) => [
                styles.shutterOuter,
                busy && styles.shutterDisabled,
                pressed && !busy && styles.shutterPressed,
              ]}
              onPress={takePhoto}
              disabled={busy}>
              <View style={styles.shutterInner} />
            </Pressable>

            <FlipCameraButton
              accessibilityLabel={Copy.cameraFlip}
              onPress={handleFlip}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const SIDE_BTN = 52;

const styles = StyleSheet.create({
  black: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraRoot: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  hintWrap: {
    position: 'absolute',
    left: Page.insetWide,
    right: Page.insetWide,
    bottom: 200,
    alignItems: 'center',
  },
  hint: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: Type.footnote,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.full,
    overflow: 'hidden',
    textAlign: 'center',
  },
  bottomBar: {
    // 在安全区之上再抬高一截，避免贴底部
    paddingBottom: 36,
    paddingTop: 8,
    paddingHorizontal: Page.insetWide,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sideBtn: {
    width: SIDE_BTN,
    height: SIDE_BTN,
    borderRadius: SIDE_BTN / 2,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideBtnPressed: {
    opacity: 0.75,
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
  shutterOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Brand.white,
  },
  shutterPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  shutterDisabled: {
    opacity: 0.5,
  },
  preview: {
    flex: 1,
    width: '100%',
  },
  previewBarSafe: {
    backgroundColor: 'rgba(0,0,0,0.88)',
  },
  previewBar: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Page.insetWide,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  permissionSafe: {
    flex: 1,
    backgroundColor: Brand.canvas,
  },
  permissionBox: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Page.insetWide,
    gap: Spacing.sm,
  },
  permissionTitle: {
    fontSize: Type.title,
    fontWeight: '700',
    color: Brand.black,
    letterSpacing: 0.2,
  },
  permissionBody: {
    fontSize: Type.subhead,
    lineHeight: 22,
    color: Brand.gray600,
    marginBottom: Spacing.md,
  },
  primaryBtn: {
    flex: 1,
    minHeight: 50,
    borderRadius: Radius.md,
    backgroundColor: Brand.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnDisabled: {
    opacity: 0.55,
  },
  primaryBtnText: {
    color: Brand.black,
    fontSize: Type.callout,
    fontWeight: '600',
  },
  secondaryBtn: {
    flex: 1,
    minHeight: 50,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: Brand.white,
    fontSize: Type.callout,
    fontWeight: '600',
  },
  lightPrimaryBtn: {
    minHeight: 50,
    borderRadius: Radius.md,
    backgroundColor: Brand.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightPrimaryBtnText: {
    color: Brand.white,
    fontSize: Type.callout,
    fontWeight: '600',
  },
  lightSecondaryBtn: {
    minHeight: 50,
    borderRadius: Radius.md,
    backgroundColor: Brand.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightSecondaryBtnText: {
    color: Brand.black,
    fontSize: Type.callout,
    fontWeight: '600',
  },
});
