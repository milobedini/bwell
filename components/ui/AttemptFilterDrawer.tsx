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
import { Button, Chip, Divider, IconButton, Portal, Surface, TextInput } from 'react-native-paper';
import Constants from 'expo-constants';
import { Colors } from '@/constants/Colors';
import { type AttemptFilterDrawerValues, DEFAULT_FILTERS, type DrawerStatusOption } from '@/constants/Filters';
import { clamp } from '@/utils/helpers';

import { ThemedText } from '../ThemedText';

export type AttemptFilterDrawerProps = {
  visible: boolean;
  onDismiss: () => void;
  values: AttemptFilterDrawerValues;
  onChange: (values: AttemptFilterDrawerValues) => void;
  onApply: (values: AttemptFilterDrawerValues) => void;
  onReset?: () => void;
  // Optional: allow passing module choices to render chips instead of a raw field
  moduleChoices?: { id: string; title: string }[];
  patientChoices?: { id: string; name: string; email: string }[];
  showSeverity?: boolean;
  showPatient?: boolean;
  title?: string;
};

export const AttemptFilterDrawer = ({
  visible,
  onDismiss,
  values,
  onChange,
  onApply,
  onReset,
  moduleChoices,
  patientChoices,
  showSeverity,
  showPatient,
  title = 'Filters'
}: AttemptFilterDrawerProps) => {
  const { width: screenWidth } = useWindowDimensions();
  const drawerWidth = Math.min(420, Math.floor(screenWidth * 0.9));
  const [local, setLocal] = useState<AttemptFilterDrawerValues>(values);
  const [limitText, setLimitText] = useState(values.limit?.toString() ?? '');
  const [patientSearch, setPatientSearch] = useState('');

  const filteredPatients = useMemo(() => {
    if (!patientChoices?.length) return [];
    if (!patientSearch.trim()) return patientChoices;
    const q = patientSearch.toLowerCase();
    return patientChoices.filter((p) => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q));
  }, [patientChoices, patientSearch]);
  const translateX = useRef(new Animated.Value(drawerWidth)).current;

  useEffect(() => {
    // sync external changes when drawer opens with fresh defaults
    if (visible) {
      setLocal(values);
      setLimitText(values.limit?.toString() ?? '');
      setPatientSearch('');
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
    setPatientSearch('');
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
                  return (
                    <Chip key={opt} selected={selected} onPress={() => setStatus(opt)} style={styles.chip}>
                      {opt}
                    </Chip>
                  );
                })}
              </View>
            </View>

            {/* Patient */}
            {showPatient && patientChoices && (
              <View style={styles.section}>
                <ThemedText type="smallTitle" style={styles.sectionTitle}>
                  Patient
                </ThemedText>
                <TextInput
                  mode="outlined"
                  placeholder="Search patients..."
                  value={patientSearch}
                  onChangeText={setPatientSearch}
                  left={<TextInput.Icon icon="magnify" />}
                  style={{ backgroundColor: Colors.chip.darkCard }}
                />
                <View style={styles.rowWrap}>
                  <Chip
                    selected={!local.patientId}
                    onPress={() => setLocal((prev) => ({ ...prev, patientId: undefined }))}
                    style={styles.chip}
                  >
                    Any
                  </Chip>
                  {filteredPatients.map((p) => (
                    <Chip
                      key={p.id}
                      selected={local.patientId === p.id}
                      onPress={() =>
                        setLocal((prev) => ({
                          ...prev,
                          patientId: prev.patientId === p.id ? undefined : p.id
                        }))
                      }
                      style={styles.chip}
                    >
                      {p.name}
                    </Chip>
                  ))}
                </View>
              </View>
            )}

            {/* Module */}
            <View style={styles.section}>
              <ThemedText type="smallTitle" style={styles.sectionTitle}>
                Module
              </ThemedText>
              {moduleChoices?.length ? (
                <View style={styles.rowWrap}>
                  <Chip
                    selected={!local.moduleId}
                    onPress={() => setLocal((prev) => ({ ...prev, moduleId: undefined }))}
                    style={styles.chip}
                  >
                    Any
                  </Chip>
                  {moduleChoices.map((m) => (
                    <Chip
                      key={m.id}
                      selected={local.moduleId === m.id}
                      onPress={() => setLocal((prev) => ({ ...prev, moduleId: m.id }))}
                      style={styles.chip}
                    >
                      {m.title}
                    </Chip>
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

            {/* Severity */}
            {showSeverity && (
              <View style={styles.section}>
                <ThemedText type="smallTitle" style={styles.sectionTitle}>
                  Severity
                </ThemedText>
                <View style={styles.rowWrap}>
                  <Chip
                    selected={!local.severity}
                    onPress={() => setLocal((prev) => ({ ...prev, severity: undefined }))}
                    style={styles.chip}
                  >
                    Any
                  </Chip>
                  {(['severe', 'moderate', 'mild'] as const).map((sev) => (
                    <Chip
                      key={sev}
                      selected={local.severity === sev}
                      onPress={() =>
                        setLocal((prev) => ({
                          ...prev,
                          severity: prev.severity === sev ? undefined : sev
                        }))
                      }
                      style={styles.chip}
                    >
                      {sev.charAt(0).toUpperCase() + sev.slice(1)}
                    </Chip>
                  ))}
                </View>
              </View>
            )}

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
  chip: { marginRight: 4 },
  helper: { opacity: 0.6, marginTop: 4 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 'auto'
  }
});
