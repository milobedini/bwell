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
import { Button, Chip, Divider, IconButton, Portal, Surface, TextInput } from 'react-native-paper';
import Constants from 'expo-constants';
import { Colors } from '@/constants/Colors';
import type { UserRole, UsersFacets } from '@milobedini/shared-types';

import { ThemedText } from '../ThemedText';

export type UserFilters = {
  roles?: UserRole[];
  isVerified?: boolean;
  isVerifiedTherapist?: boolean;
  hasTherapist?: boolean;
  createdFrom?: string;
  createdTo?: string;
  lastLoginFrom?: string;
  lastLoginTo?: string;
};

export const DEFAULT_USER_FILTERS: UserFilters = {};

export const countActiveFilters = (f: UserFilters): number =>
  [
    f.roles?.length,
    f.isVerified !== undefined,
    f.isVerifiedTherapist !== undefined,
    f.hasTherapist !== undefined,
    f.createdFrom,
    f.createdTo,
    f.lastLoginFrom,
    f.lastLoginTo
  ].filter(Boolean).length;

type UserFilterDrawerProps = {
  visible: boolean;
  onDismiss: () => void;
  values: UserFilters;
  onApply: (values: UserFilters) => void;
  facets?: UsersFacets;
};

const ROLE_OPTIONS: UserRole[] = ['patient', 'therapist', 'admin'];

const getFacetCount = <T,>(facets: { _id: T; count: number }[] | undefined, id: T): number | undefined =>
  facets?.find((f) => f._id === id)?.count;

const UserFilterDrawer = ({ visible, onDismiss, values, onApply, facets }: UserFilterDrawerProps) => {
  const { width: screenWidth } = useWindowDimensions();
  const drawerWidth = Math.min(420, Math.floor(screenWidth * 0.9));
  const translateX = useRef(new Animated.Value(drawerWidth)).current;
  const [local, setLocal] = useState<UserFilters>(values);

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

  const toggleRole = (role: UserRole) => {
    setLocal((prev) => {
      const current = new Set(prev.roles ?? []);
      if (current.has(role)) current.delete(role);
      else current.add(role);
      const next = Array.from(current);
      return { ...prev, roles: next.length ? next : undefined };
    });
  };

  const toggleBoolean = (key: 'isVerified' | 'isVerifiedTherapist' | 'hasTherapist', val: boolean) => {
    setLocal((prev) => ({
      ...prev,
      [key]: prev[key] === val ? undefined : val
    }));
  };

  const handleApply = () => {
    onApply(local);
    onDismiss();
  };

  const handleReset = () => {
    setLocal(DEFAULT_USER_FILTERS);
  };

  const booleanSection = (
    label: string,
    key: 'isVerified' | 'isVerifiedTherapist' | 'hasTherapist',
    facetData?: { _id: boolean; count: number }[]
  ) => (
    <View style={styles.section}>
      <ThemedText type="small" className="text-sway-darkGrey">
        {label}
      </ThemedText>
      <View style={styles.rowWrap}>
        {[true, false].map((val) => {
          const isSelected = local[key] === val;
          const count = getFacetCount(facetData, val);
          const chipLabel = `${val ? 'Yes' : 'No'}${count !== undefined ? ` (${count})` : ''}`;
          return (
            <Chip
              key={String(val)}
              selected={isSelected}
              onPress={() => toggleBoolean(key, val)}
              style={[styles.chip, isSelected && styles.chipSelected]}
              textStyle={isSelected ? { color: Colors.sway.bright } : undefined}
            >
              {chipLabel}
            </Chip>
          );
        })}
      </View>
    </View>
  );

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

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              {/* Roles */}
              <View style={styles.section}>
                <ThemedText type="small" className="text-sway-darkGrey">
                  Roles
                </ThemedText>
                <View style={styles.rowWrap}>
                  {ROLE_OPTIONS.map((role) => {
                    const isSelected = (local.roles ?? []).includes(role);
                    const count = getFacetCount(facets?.roles, role);
                    const chipLabel = `${role.charAt(0).toUpperCase() + role.slice(1)}${count !== undefined ? ` (${count})` : ''}`;
                    return (
                      <Chip
                        key={role}
                        selected={isSelected}
                        onPress={() => toggleRole(role)}
                        style={[styles.chip, isSelected && styles.chipSelected]}
                        textStyle={isSelected ? { color: Colors.sway.bright } : undefined}
                      >
                        {chipLabel}
                      </Chip>
                    );
                  })}
                </View>
              </View>

              {/* Boolean filters */}
              {booleanSection('Email Verified', 'isVerified', facets?.isVerified)}
              {booleanSection('Therapist Verified', 'isVerifiedTherapist', facets?.isVerifiedTherapist)}
              {booleanSection('Has Therapist', 'hasTherapist', facets?.hasTherapist)}

              {/* Created Date */}
              <View style={styles.section}>
                <ThemedText type="small" className="text-sway-darkGrey">
                  Created Date
                </ThemedText>
                <View style={styles.dateRow}>
                  <TextInput
                    mode="outlined"
                    label="From"
                    placeholder="YYYY-MM-DD"
                    value={local.createdFrom ?? ''}
                    onChangeText={(t) => setLocal((prev) => ({ ...prev, createdFrom: t || undefined }))}
                    keyboardType="numeric"
                    dense
                    style={styles.dateInput}
                  />
                  <TextInput
                    mode="outlined"
                    label="To"
                    placeholder="YYYY-MM-DD"
                    value={local.createdTo ?? ''}
                    onChangeText={(t) => setLocal((prev) => ({ ...prev, createdTo: t || undefined }))}
                    keyboardType="numeric"
                    dense
                    style={styles.dateInput}
                  />
                </View>
              </View>

              {/* Last Login */}
              <View style={styles.section}>
                <ThemedText type="small" className="text-sway-darkGrey">
                  Last Login
                </ThemedText>
                <View style={styles.dateRow}>
                  <TextInput
                    mode="outlined"
                    label="From"
                    placeholder="YYYY-MM-DD"
                    value={local.lastLoginFrom ?? ''}
                    onChangeText={(t) => setLocal((prev) => ({ ...prev, lastLoginFrom: t || undefined }))}
                    keyboardType="numeric"
                    dense
                    style={styles.dateInput}
                  />
                  <TextInput
                    mode="outlined"
                    label="To"
                    placeholder="YYYY-MM-DD"
                    value={local.lastLoginTo ?? ''}
                    onChangeText={(t) => setLocal((prev) => ({ ...prev, lastLoginTo: t || undefined }))}
                    keyboardType="numeric"
                    dense
                    style={styles.dateInput}
                  />
                </View>
              </View>
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
  chip: {
    borderWidth: 1,
    borderColor: Colors.sway.buttonBackgroundSolid
  },
  chipSelected: {
    borderColor: Colors.sway.bright,
    backgroundColor: 'rgba(24, 205, 186, 0.12)'
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10
  },
  dateInput: {
    flex: 1
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 4
  }
});

export default UserFilterDrawer;
