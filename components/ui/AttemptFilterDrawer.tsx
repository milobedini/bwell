import { useEffect, useMemo, useRef, useState } from 'react';
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
import { Button, Chip, Divider, IconButton, Portal, Surface, TextInput } from 'react-native-paper';
import Constants from 'expo-constants';
import { Colors } from '@/constants/Colors';
import { type AttemptFilterDrawerValues, DEFAULT_FILTERS, type DrawerStatusOption } from '@/constants/Filters';
import { clamp } from '@/utils/helpers';

import { ThemedText } from '../ThemedText';

import SearchPickerDialog from './SearchPickerDialog';
import SelectField from './SelectField';

export type AttemptFilterDrawerProps = {
  visible: boolean;
  onDismiss: () => void;
  values: AttemptFilterDrawerValues;
  onChange: (values: AttemptFilterDrawerValues) => void;
  onApply: (values: AttemptFilterDrawerValues) => void;
  onReset?: () => void;
  moduleChoices?: { id: string; title: string }[];
  patientChoices?: { id: string; name: string; email: string }[];
  showSeverity?: boolean;
  showPatient?: boolean;
  showLimit?: boolean;
  title?: string;
};

const chipStyle = (selected: boolean) => ({
  backgroundColor: selected ? Colors.tint.teal : Colors.chip.darkCard,
  borderColor: selected ? Colors.sway.bright : Colors.chip.darkCardAlt,
  borderWidth: 1
});

const chipTextStyle = (selected: boolean) => ({
  color: selected ? Colors.sway.bright : Colors.sway.darkGrey,
  fontSize: 13
});

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
  showLimit = true,
  title = 'Filters'
}: AttemptFilterDrawerProps) => {
  const { width: screenWidth } = useWindowDimensions();
  const drawerWidth = Math.min(420, Math.floor(screenWidth * 0.9));
  const [local, setLocal] = useState<AttemptFilterDrawerValues>(values);
  const [limitText, setLimitText] = useState(values.limit?.toString() ?? '');
  const [patientPickerOpen, setPatientPickerOpen] = useState(false);

  const patientPickerItems = useMemo(
    () =>
      patientChoices?.map((p) => ({
        _id: p.id,
        title: p.name,
        subtitle: p.email
      })) ?? [],
    [patientChoices]
  );

  const selectedPatientName = useMemo(
    () => patientChoices?.find((p) => p.id === local.patientId)?.name,
    [patientChoices, local.patientId]
  );

  const translateX = useRef(new Animated.Value(drawerWidth)).current;

  useEffect(() => {
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

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* Status */}
              <View style={styles.section}>
                <ThemedText type="smallTitle" style={styles.sectionTitle}>
                  Status
                </ThemedText>
                <View style={styles.rowWrap}>
                  {statusOptions.map((opt) => {
                    const selected = (local.status ?? []).includes(opt);
                    return (
                      <Chip
                        key={opt}
                        selected={selected}
                        onPress={() => setStatus(opt)}
                        style={chipStyle(selected)}
                        textStyle={chipTextStyle(selected)}
                      >
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
                  <SelectField
                    label="Patient"
                    value={selectedPatientName}
                    placeholder="Any patient"
                    selected={!!local.patientId}
                    leftIcon="account-circle-outline"
                    onPress={() => setPatientPickerOpen(true)}
                    onClear={() => setLocal((prev) => ({ ...prev, patientId: undefined }))}
                  />
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
                      style={chipStyle(!local.moduleId)}
                      textStyle={chipTextStyle(!local.moduleId)}
                    >
                      Any
                    </Chip>
                    {moduleChoices.map((m) => {
                      const selected = local.moduleId === m.id;
                      return (
                        <Chip
                          key={m.id}
                          selected={selected}
                          onPress={() =>
                            setLocal((prev) => ({
                              ...prev,
                              moduleId: prev.moduleId === m.id ? undefined : m.id
                            }))
                          }
                          style={chipStyle(selected)}
                          textStyle={chipTextStyle(selected)}
                        >
                          {m.title}
                        </Chip>
                      );
                    })}
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
                      style={chipStyle(!local.severity)}
                      textStyle={chipTextStyle(!local.severity)}
                    >
                      Any
                    </Chip>
                    {(['severe', 'moderate', 'mild'] as const).map((sev) => {
                      const selected = local.severity === sev;
                      return (
                        <Chip
                          key={sev}
                          selected={selected}
                          onPress={() =>
                            setLocal((prev) => ({
                              ...prev,
                              severity: prev.severity === sev ? undefined : sev
                            }))
                          }
                          style={chipStyle(selected)}
                          textStyle={chipTextStyle(selected)}
                        >
                          {sev.charAt(0).toUpperCase() + sev.slice(1)}
                        </Chip>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Limit */}
              {showLimit && (
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
              )}
            </ScrollView>

            <View style={styles.footer}>
              <Button
                onPress={handleReset}
                mode="outlined"
                textColor={Colors.sway.lightGrey}
                style={{ borderColor: Colors.chip.darkCardAlt }}
              >
                Reset
              </Button>
              <View style={{ flex: 1 }} />
              <Button onPress={onDismiss} mode="text" textColor={Colors.sway.darkGrey}>
                Cancel
              </Button>
              <Button onPress={handleApply} mode="contained" buttonColor={Colors.sway.bright} textColor="black">
                Apply
              </Button>
            </View>
          </Surface>
        </Animated.View>
      </KeyboardAvoidingView>

      {/* Patient picker dialog — rendered outside the drawer so it layers on top */}
      <SearchPickerDialog
        visible={patientPickerOpen}
        onDismiss={() => setPatientPickerOpen(false)}
        items={patientPickerItems}
        title="Select Patient"
        onSelect={(item) => setLocal((prev) => ({ ...prev, patientId: item._id }))}
        leftIcon={() => 'account'}
        rightIcon={() => 'check-circle'}
      />
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
  scrollContent: {
    flex: 1
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
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.chip.darkCardAlt
  }
});
