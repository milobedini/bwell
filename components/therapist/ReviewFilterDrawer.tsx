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
import Constants from 'expo-constants';
import { Colors } from '@/constants/Colors';
import { filterChipStyle, filterChipTextStyle } from '@/utils/chipStyles';
import type { SeverityOption } from '@milobedini/shared-types';

import { ThemedText } from '../ThemedText';
import SearchPickerDialog from '../ui/SearchPickerDialog';
import SelectField from '../ui/SelectField';

export type ReviewFilterValues = {
  patientId?: string;
  moduleId?: string;
  severity?: SeverityOption;
};

export const DEFAULT_REVIEW_FILTERS: ReviewFilterValues = {};

type ReviewFilterDrawerProps = {
  visible: boolean;
  onDismiss: () => void;
  values: ReviewFilterValues;
  onApply: (values: ReviewFilterValues) => void;
  onReset?: () => void;
  patientChoices?: { id: string; name: string; email: string }[];
  moduleChoices?: { id: string; title: string }[];
};

const SEVERITY_OPTIONS: SeverityOption[] = ['severe', 'moderate', 'mild'];

const ReviewFilterDrawer = ({
  visible,
  onDismiss,
  values,
  onApply,
  onReset,
  patientChoices,
  moduleChoices
}: ReviewFilterDrawerProps) => {
  const { width: screenWidth } = useWindowDimensions();
  const drawerWidth = Math.min(420, Math.floor(screenWidth * 0.9));
  const [local, setLocal] = useState<ReviewFilterValues>(values);
  const [patientPickerOpen, setPatientPickerOpen] = useState(false);

  const selectedPatientName = useMemo(
    () => patientChoices?.find((p) => p.id === local.patientId)?.name,
    [patientChoices, local.patientId]
  );

  const patientPickerItems = useMemo(
    () => (patientChoices ?? []).map((p) => ({ _id: p.id, title: p.name, subtitle: p.email })),
    [patientChoices]
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
    onDismiss();
  };

  const handleReset = () => {
    setLocal(DEFAULT_REVIEW_FILTERS);
    onReset?.();
  };

  const activeFilterCount = [local.patientId, local.moduleId, local.severity].filter(Boolean).length;

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
              <ThemedText type="subtitle">Filters</ThemedText>
              <IconButton icon="close" onPress={onDismiss} />
            </View>

            <Divider />

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* Patient */}
              {patientChoices && patientChoices.length > 0 && (
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
              {moduleChoices && moduleChoices.length > 0 && (
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
                          style={filterChipStyle(selected)}
                          textStyle={filterChipTextStyle(selected)}
                        >
                          {m.title}
                        </Chip>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Severity */}
              <View style={styles.section}>
                <ThemedText type="smallTitle" style={styles.sectionTitle}>
                  Severity
                </ThemedText>
                <View style={styles.rowWrap}>
                  <Chip
                    selected={!local.severity}
                    onPress={() => setLocal((prev) => ({ ...prev, severity: undefined }))}
                    style={filterChipStyle(!local.severity)}
                    textStyle={filterChipTextStyle(!local.severity)}
                  >
                    Any
                  </Chip>
                  {SEVERITY_OPTIONS.map((sev) => {
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
                        style={filterChipStyle(selected)}
                        textStyle={filterChipTextStyle(selected)}
                      >
                        {sev.charAt(0).toUpperCase() + sev.slice(1)}
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
                disabled={activeFilterCount === 0}
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

export default ReviewFilterDrawer;

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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.chip.darkCardAlt
  }
});
