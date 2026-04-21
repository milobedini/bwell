import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View
} from 'react-native';
import { Button, Chip, Divider, IconButton, Portal, Surface } from 'react-native-paper';
import Constants from 'expo-constants';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import type { UseAdminAuditFilters } from '@/hooks/useAdminAudit';
import { filterChipStyle, filterChipTextStyle } from '@/utils/chipStyles';
import type { AuditedAction } from '@milobedini/shared-types';

const ACTION_OPTIONS: AuditedAction[] = [
  'therapist.verified',
  'therapist.unverified',
  'user.viewed',
  'patient.attemptsViewed',
  'module.created',
  'admin.loggedIn'
];

export const countActiveAuditFilters = (f: UseAdminAuditFilters): number =>
  [f.action, f.actorId, f.resourceType, f.resourceId].filter(Boolean).length;

export type ActorOption = { _id: string; username: string; name?: string; count?: number };

type Props = {
  visible: boolean;
  onDismiss: () => void;
  values: UseAdminAuditFilters;
  onApply: (values: UseAdminAuditFilters) => void;
  actorOptions: ActorOption[];
};

const AuditFilterDrawer = ({ visible, onDismiss, values, onApply, actorOptions }: Props) => {
  const { width: screenWidth } = useWindowDimensions();
  const drawerWidth = Math.min(420, Math.floor(screenWidth * 0.9));
  const translateX = useRef(new Animated.Value(drawerWidth)).current;
  const [local, setLocal] = useState<UseAdminAuditFilters>(values);

  const [prevVisible, setPrevVisible] = useState(visible);
  if (prevVisible !== visible) {
    setPrevVisible(visible);
    if (visible) setLocal(values);
  }

  useEffect(() => {
    const animation = Animated.timing(translateX, {
      toValue: visible ? 0 : drawerWidth,
      duration: 220,
      useNativeDriver: true
    });
    animation.start();
    return () => animation.stop();
  }, [visible, translateX, drawerWidth]);

  const toggleAction = (action: AuditedAction) => {
    setLocal((prev) => ({ ...prev, action: prev.action === action ? undefined : action }));
  };

  const toggleActor = (actorId: string) => {
    setLocal((prev) => ({ ...prev, actorId: prev.actorId === actorId ? undefined : actorId }));
  };

  const handleApply = () => {
    onApply(local);
    onDismiss();
  };

  const handleReset = () => setLocal({});

  return (
    <Portal>
      {visible && <Pressable style={styles.backdrop} onPress={onDismiss} />}
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        pointerEvents="box-none"
        style={StyleSheet.absoluteFill}
      >
        <Animated.View
          style={[styles.drawerContainer, { width: drawerWidth, transform: [{ translateX }] }]}
          pointerEvents={visible ? 'auto' : 'none'}
        >
          <Surface elevation={3} style={styles.surface}>
            <View style={styles.header}>
              <ThemedText type="subtitle">Audit filters</ThemedText>
              <IconButton icon="close" onPress={onDismiss} />
            </View>

            <Divider />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              <View style={styles.section}>
                <ThemedText type="small" className="text-sway-darkGrey">
                  Action
                </ThemedText>
                <View style={styles.rowWrap}>
                  {ACTION_OPTIONS.map((action) => {
                    const selected = local.action === action;
                    return (
                      <Chip
                        key={action}
                        selected={selected}
                        onPress={() => toggleAction(action)}
                        style={filterChipStyle(selected)}
                        textStyle={filterChipTextStyle(selected)}
                      >
                        {action}
                      </Chip>
                    );
                  })}
                </View>
              </View>

              {actorOptions.length > 0 && (
                <View style={styles.section}>
                  <ThemedText type="small" className="text-sway-darkGrey">
                    Actor
                  </ThemedText>
                  <View style={styles.rowWrap}>
                    {actorOptions.map((actor) => {
                      const selected = local.actorId === actor._id;
                      const base = actor.name ?? actor.username;
                      const label = actor.count !== undefined ? `${base} (${actor.count})` : base;
                      return (
                        <Chip
                          key={actor._id}
                          selected={selected}
                          onPress={() => toggleActor(actor._id)}
                          style={filterChipStyle(selected)}
                          textStyle={filterChipTextStyle(selected)}
                        >
                          {label}
                        </Chip>
                      );
                    })}
                  </View>
                </View>
              )}
            </ScrollView>

            <Divider style={{ marginBottom: 12 }} />
            <View style={styles.footer}>
              <Button onPress={handleReset} mode="text" textColor={Colors.sway.darkGrey} compact>
                Reset All
              </Button>
              <View style={{ flex: 1 }} />
              <Button onPress={onDismiss} mode="text" textColor={Colors.sway.darkGrey} compact>
                Cancel
              </Button>
              <Button onPress={handleApply} mode="contained" buttonColor={Colors.sway.bright} textColor="black">
                Apply
              </Button>
            </View>
          </Surface>
        </Animated.View>
      </KeyboardAvoidingView>
    </Portal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay.light
  },
  drawerContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0
  },
  surface: {
    flex: 1,
    padding: 16,
    backgroundColor: Colors.sway.dark,
    paddingTop: Constants.statusBarHeight
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'space-between',
    marginBottom: 8
  },
  section: {
    marginTop: 20,
    gap: 10
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 4
  }
});

export default AuditFilterDrawer;
