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
import { Button, Chip, Divider, IconButton, Portal, Surface } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { filterChipStyle, filterChipTextStyle } from '@/utils/chipStyles';
import type { AssignmentStatus, AssignmentUrgencyFilter } from '@milobedini/shared-types';

import { ThemedText } from '../ThemedText';
import SearchPickerDialog from '../ui/SearchPickerDialog';
import SelectField from '../ui/SelectField';

export type AssignmentFilterValues = {
  patientId?: string;
  moduleId?: string;
  status?: string;
  urgency?: AssignmentUrgencyFilter;
};

export const DEFAULT_ASSIGNMENT_FILTERS: AssignmentFilterValues = {
  patientId: undefined,
  moduleId: undefined,
  status: undefined,
  urgency: undefined
};

type AssignmentFilterDrawerProps = {
  visible: boolean;
  onDismiss: () => void;
  values: AssignmentFilterValues;
  onApply: (values: AssignmentFilterValues) => void;
  onReset: () => void;
  moduleChoices?: { id: string; title: string }[];
  patientChoices?: { id: string; name: string; email: string }[];
};

const STATUS_OPTIONS = [
  { value: undefined, label: 'All' },
  { value: 'assigned' as AssignmentStatus, label: 'Assigned' },
  { value: 'in_progress' as AssignmentStatus, label: 'In Progress' }
] as const;

const URGENCY_OPTIONS: { value: AssignmentUrgencyFilter | undefined; label: string }[] = [
  { value: undefined, label: 'All' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'due_soon', label: 'Due Soon' },
  { value: 'on_track', label: 'On Track' },
  { value: 'no_due_date', label: 'No Due Date' }
];

const AssignmentFilterDrawer = ({
  visible,
  onDismiss,
  values,
  onApply,
  onReset,
  moduleChoices,
  patientChoices
}: AssignmentFilterDrawerProps) => {
  const { width: screenWidth } = useWindowDimensions();
  const { top: safeTop } = useSafeAreaInsets();
  const drawerWidth = Math.min(420, Math.floor(screenWidth * 0.9));
  const [local, setLocal] = useState<AssignmentFilterValues>(values);
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
    if (visible) setLocal(values);
  }, [visible, values]);

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: visible ? 0 : drawerWidth,
      duration: 220,
      useNativeDriver: true
    }).start();
  }, [visible, translateX, drawerWidth]);

  const handleApply = () => {
    onApply(local);
  };

  const handleReset = () => {
    setLocal(DEFAULT_ASSIGNMENT_FILTERS);
    onReset();
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
          <Surface elevation={3} style={[styles.surface, { paddingTop: safeTop }]}>
            <View style={styles.header}>
              <ThemedText type="subtitle">Filter Assignments</ThemedText>
              <IconButton icon="close" onPress={onDismiss} />
            </View>

            <Divider />

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* Patient */}
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

              {/* Module */}
              <View style={styles.section}>
                <ThemedText type="smallTitle" style={styles.sectionTitle}>
                  Module
                </ThemedText>
                <View style={styles.rowWrap}>
                  <Chip
                    selected={!local.moduleId}
                    onPress={() => setLocal((prev) => ({ ...prev, moduleId: undefined }))}
                    style={filterChipStyle(!local.moduleId)}
                    textStyle={filterChipTextStyle(!local.moduleId)}
                  >
                    All
                  </Chip>
                  {moduleChoices?.map((m) => {
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
                        style={filterChipStyle(selected)}
                        textStyle={filterChipTextStyle(selected)}
                      >
                        {m.title}
                      </Chip>
                    );
                  })}
                </View>
              </View>

              {/* Status */}
              <View style={styles.section}>
                <ThemedText type="smallTitle" style={styles.sectionTitle}>
                  Status
                </ThemedText>
                <View style={styles.rowWrap}>
                  {STATUS_OPTIONS.map((opt) => {
                    const selected = local.status === opt.value;
                    return (
                      <Chip
                        key={opt.label}
                        selected={selected}
                        onPress={() => setLocal((prev) => ({ ...prev, status: opt.value }))}
                        style={filterChipStyle(selected)}
                        textStyle={filterChipTextStyle(selected)}
                      >
                        {opt.label}
                      </Chip>
                    );
                  })}
                </View>
              </View>

              {/* Urgency */}
              <View style={styles.section}>
                <ThemedText type="smallTitle" style={styles.sectionTitle}>
                  Urgency
                </ThemedText>
                <View style={styles.rowWrap}>
                  {URGENCY_OPTIONS.map((opt) => {
                    const selected = local.urgency === opt.value;
                    return (
                      <Chip
                        key={opt.label}
                        selected={selected}
                        onPress={() => setLocal((prev) => ({ ...prev, urgency: opt.value }))}
                        style={filterChipStyle(selected)}
                        textStyle={filterChipTextStyle(selected)}
                      >
                        {opt.label}
                      </Chip>
                    );
                  })}
                </View>
              </View>
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
              <Button
                onPress={handleApply}
                mode="contained"
                buttonColor={Colors.sway.bright}
                textColor={Colors.primary.black}
              >
                Apply
              </Button>
            </View>
          </Surface>
        </Animated.View>
      </KeyboardAvoidingView>

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
    backgroundColor: Colors.sway.dark
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'space-between',
    marginBottom: 8
  },
  scrollContent: { flex: 1 },
  section: { marginTop: 16, gap: 8 },
  sectionTitle: { marginBottom: 4 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.chip.darkCardAlt
  }
});

export default AssignmentFilterDrawer;
