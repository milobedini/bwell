import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View
} from 'react-native';
import { Button, Divider, IconButton, Portal, Surface, TextInput } from 'react-native-paper';
import Constants from 'expo-constants';
import { Colors } from '@/constants/Colors';
import { DEFAULT_FILTERS, type FilterDrawerValues } from '@/constants/Filters';
import { clamp } from '@/utils/helpers';

import { ThemedText } from '../ThemedText';

import { SelectableChip } from './Chip';

export type DrawerStatusOption = 'submitted' | 'active' | 'started' | 'abandoned' | 'all';

export type FilterDrawerProps = {
  visible: boolean;
  onDismiss: () => void;
  values: FilterDrawerValues;
  onChange: (values: FilterDrawerValues) => void;
  onApply: (values: FilterDrawerValues) => void;
  onReset?: () => void;
  // Optional: allow passing module choices to render chips instead of a raw field
  moduleChoices?: { id: string; title: string }[];
  title?: string;
};

export const FilterDrawer = ({
  visible,
  onDismiss,
  values,
  onChange,
  onApply,
  onReset,
  moduleChoices,
  title = 'Filters'
}: FilterDrawerProps) => {
  const { width: screenWidth } = useWindowDimensions();
  const drawerWidth = Math.min(420, Math.floor(screenWidth * 0.9));
  const [local, setLocal] = useState<FilterDrawerValues>(values);
  const [limitText, setLimitText] = useState(values.limit?.toString() ?? '');
  const translateX = useRef(new Animated.Value(drawerWidth)).current;

  useEffect(() => {
    // sync external changes when drawer opens with fresh defaults
    if (visible) {
      setLocal(values);
      setLimitText(values.limit?.toString() ?? '');
    }
  }, [visible, values]);

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: visible ? 0 : drawerWidth,
      duration: 220,
      useNativeDriver: true
    }).start();
  }, [visible, translateX, drawerWidth]);

  const setStatus = (s: DrawerStatusOption) => {
    setLocal((prev) => {
      const current = new Set(prev.status ?? []);
      if (current.has(s)) current.delete(s);
      else current.add(s);
      // If selecting "all", clear others; if adding any other, remove "all"
      let next = Array.from(current);
      if (next.includes('all') && next.length > 1) next = ['all'];
      if (s !== 'all') next = next.filter((x) => x !== 'all');
      return { ...prev, status: next };
    });
  };

  const statusOptions: DrawerStatusOption[] = useMemo(() => ['submitted', 'active', 'started', 'abandoned', 'all'], []);

  const handleApply = () => {
    const n = parseInt(limitText, 10);
    const limitNum = clamp(Number.isFinite(n) ? n : 20, 1, 100);
    const next = { ...local, limit: limitNum };
    onChange(next);
    onApply(next);
    onDismiss();
  };

  const handleReset = () => {
    setLocal(DEFAULT_FILTERS);
    onChange(DEFAULT_FILTERS);
    onReset?.();
  };

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
              <ThemedText type="subtitle">{title}</ThemedText>
              <IconButton icon="close" onPress={onDismiss} />
            </View>

            <Divider />

            {/* Status */}
            <View style={styles.section}>
              <ThemedText type="smallTitle" style={styles.sectionTitle}>
                Status
              </ThemedText>
              <View style={styles.rowWrap}>
                {statusOptions.map((opt) => {
                  const selected = (local.status ?? []).includes(opt);
                  return <SelectableChip key={opt} label={opt} selected={selected} onPress={() => setStatus(opt)} />;
                })}
              </View>
            </View>

            {/* Module */}
            <View style={styles.section}>
              <ThemedText type="smallTitle" style={styles.sectionTitle}>
                Module
              </ThemedText>
              {moduleChoices?.length ? (
                <View style={styles.rowWrap}>
                  <SelectableChip
                    label="Any"
                    selected={!local.moduleId}
                    onPress={() => setLocal((prev) => ({ ...prev, moduleId: undefined }))}
                  />
                  {moduleChoices.map((m) => (
                    <SelectableChip
                      key={m.id}
                      label={m.title}
                      selected={local.moduleId === m.id}
                      onPress={() => setLocal((prev) => ({ ...prev, moduleId: m.id }))}
                    />
                  ))}
                </View>
              ) : (
                <TextInput
                  mode="outlined"
                  label={<ThemedText>Module ID (optional)</ThemedText>}
                  value={local.moduleId ?? ''}
                  onChangeText={(t) => setLocal((prev) => ({ ...prev, moduleId: t || undefined }))}
                />
              )}
            </View>

            {/* Limit */}
            <View style={styles.section}>
              <ThemedText type="smallTitle" style={styles.sectionTitle}>
                Limit
              </ThemedText>
              <TextInput
                mode="outlined"
                keyboardType="number-pad"
                value={limitText}
                placeholder={String(DEFAULT_FILTERS.limit)}
                onChangeText={setLimitText}
              />
              <ThemedText style={styles.helper}>Default 20 · Max 100</ThemedText>
            </View>

            <View style={styles.footer}>
              <Button onPress={handleReset} mode="text" textColor="black" buttonColor={Colors.sway.darkGrey}>
                Reset
              </Button>
              <View style={{ flex: 1 }} />
              <Button onPress={onDismiss} mode="text" buttonColor={Colors.primary.error} textColor="black">
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
    marginTop: 16,
    gap: 8
  },
  sectionTitle: {
    marginBottom: 4
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  helper: { opacity: 0.6, marginTop: 4 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 'auto'
  }
});
