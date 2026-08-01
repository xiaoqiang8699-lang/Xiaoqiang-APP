import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand, Radius, Type } from '@/constants/brand';

export type AppleMoreAction = {
  key: string;
  label: string;
  /** Ionicons 名 */
  icon?: keyof typeof Ionicons.glyphMap;
  destructive?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

type Props = {
  actions: AppleMoreAction[];
  accessibilityLabel?: string;
};

/**
 * 苹果风格右上角「更多」：外层白圆 + 三点，点击弹出菜单。
 */
export function AppleMoreButton({
  actions,
  accessibilityLabel = '更多',
}: Props) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const close = useCallback(() => setOpen(false), []);

  const run = useCallback(
    (action: AppleMoreAction) => {
      close();
      requestAnimationFrame(() => action.onPress());
    },
    [close],
  );

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        hitSlop={10}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}>
        <Ionicons name="ellipsis-horizontal" size={22} color={Brand.black} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.modalRoot}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="关闭菜单" />
          <View style={[styles.menu, { top: insets.top + 44 }]}>
            {actions.map((action, index) => (
              <View key={action.key}>
                {index > 0 ? <View style={styles.divider} /> : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={action.label}
                  disabled={action.disabled}
                  onPress={() => run(action)}
                  style={({ pressed }) => [
                    styles.row,
                    pressed && styles.rowPressed,
                    action.disabled && styles.rowDisabled,
                  ]}>
                  <Text
                    style={[
                      styles.rowLabel,
                      action.destructive && styles.rowLabelDestructive,
                    ]}>
                    {action.label}
                  </Text>
                  {action.icon ? (
                    <Ionicons
                      name={action.icon}
                      size={20}
                      color={action.destructive ? '#FF3B30' : Brand.black}
                    />
                  ) : null}
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      </Modal>
    </>
  );
}

const HIT = 36;

const styles = StyleSheet.create({
  /** 只放图标，白圆交给系统导航栏外层容器（避免双圆重叠） */
  trigger: {
    width: HIT,
    height: HIT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  triggerPressed: {
    opacity: 0.55,
  },
  modalRoot: {
    flex: 1,
  },
  menu: {
    position: 'absolute',
    right: 12,
    minWidth: 200,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: Radius.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  row: {
    minHeight: 44,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  rowPressed: {
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  rowDisabled: {
    opacity: 0.4,
  },
  rowLabel: {
    fontSize: Type.body,
    color: Brand.black,
    fontWeight: '400',
  },
  rowLabelDestructive: {
    color: '#FF3B30',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Brand.hairline,
    marginLeft: 16,
  },
});
