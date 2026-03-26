import { type ComponentProps, useCallback } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { AnimatePresence, MotiView } from 'moti';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import Icon from '@react-native-vector-icons/material-design-icons';

type IconName = ComponentProps<typeof Icon>['name'];

type ActionMenuItem = {
  icon: IconName;
  label: string;
  onPress: () => void;
  variant?: 'default' | 'destructive';
};

type ActionMenuProps = {
  visible: boolean;
  onDismiss: () => void;
  title?: string;
  subtitle?: string;
  actions: ActionMenuItem[];
};

const ActionMenu = ({ visible, onDismiss, title, subtitle, actions }: ActionMenuProps) => {
  const handleAction = useCallback(
    (onPress: () => void) => {
      onDismiss();
      onPress();
    },
    [onDismiss]
  );

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss} statusBarTranslucent>
      <View className="flex-1 justify-end">
        {/* Backdrop */}
        <AnimatePresence>
          {visible && (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'timing', duration: 200 }}
              className="absolute inset-0"
            >
              <Pressable onPress={onDismiss} className="flex-1" style={{ backgroundColor: Colors.overlay.medium }} />
            </MotiView>
          )}
        </AnimatePresence>

        {/* Menu card */}
        <AnimatePresence>
          {visible && (
            <MotiView
              from={{ translateY: 300, opacity: 0 }}
              animate={{ translateY: 0, opacity: 1 }}
              exit={{ translateY: 300, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="mx-4 mb-10 overflow-hidden rounded-2xl"
              style={{ backgroundColor: Colors.chip.darkCard }}
            >
              {/* Header */}
              {(title || subtitle) && (
                <View className="border-b px-5 pb-3 pt-5" style={{ borderBottomColor: Colors.chip.darkCardAlt }}>
                  {title && (
                    <ThemedText type="smallTitle" className="text-center">
                      {title}
                    </ThemedText>
                  )}
                  {subtitle && (
                    <ThemedText type="small" className="mt-1 text-center" style={{ color: Colors.sway.darkGrey }}>
                      {subtitle}
                    </ThemedText>
                  )}
                </View>
              )}

              {/* Actions */}
              <View className="py-1">
                {actions.map((action, index) => {
                  const isDestructive = action.variant === 'destructive';
                  const iconColor = isDestructive ? Colors.primary.error : Colors.sway.bright;
                  const textColor = isDestructive ? Colors.primary.error : Colors.sway.lightGrey;

                  return (
                    <Pressable
                      key={action.label}
                      onPress={() => handleAction(action.onPress)}
                      className="flex-row items-center px-5 py-4 active:bg-chip-darkCardAlt active:opacity-70"
                    >
                      <View
                        className="mr-4 h-9 w-9 items-center justify-center rounded-xl"
                        style={{ backgroundColor: isDestructive ? Colors.tint.error : Colors.tint.teal }}
                      >
                        <Icon name={action.icon} size={20} color={iconColor} />
                      </View>
                      <ThemedText type="default" style={{ color: textColor }}>
                        {action.label}
                      </ThemedText>
                      {index < actions.length - 1 && (
                        <View
                          className="absolute bottom-0 left-5 right-5 h-px"
                          style={{ backgroundColor: Colors.chip.darkCardAlt }}
                        />
                      )}
                    </Pressable>
                  );
                })}
              </View>

              {/* Cancel button */}
              <View className="border-t px-5 py-1" style={{ borderTopColor: Colors.chip.darkCardAlt }}>
                <Pressable
                  onPress={onDismiss}
                  className="items-center py-4 active:bg-chip-darkCardAlt active:opacity-70"
                >
                  <ThemedText type="default" style={{ color: Colors.sway.darkGrey }}>
                    Cancel
                  </ThemedText>
                </Pressable>
              </View>
            </MotiView>
          )}
        </AnimatePresence>
      </View>
    </Modal>
  );
};

export default ActionMenu;
export type { ActionMenuItem, ActionMenuProps };
