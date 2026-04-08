import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { SaveProgressChip } from '@/components/ui/Chip';
import { Colors } from '@/constants/Colors';
import type { ModuleSnapshot } from '@milobedini/shared-types';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

type DiaryHeaderProps = {
  patientName?: string;
  mode: 'view' | 'edit';
  startedAt?: string;
  completedAt?: string;
  updatedAt: string;
  hasDirtyChanges: boolean;
  isSaving: boolean;
  saved: boolean;
  moduleSnapshot?: ModuleSnapshot;
  disclaimerOpen: boolean;
  setDisclaimerOpen: (open: boolean) => void;
};

const DiaryHeader = ({
  patientName,
  mode,
  startedAt,
  completedAt,
  updatedAt,
  hasDirtyChanges,
  isSaving,
  saved,
  moduleSnapshot,
  disclaimerOpen,
  setDisclaimerOpen
}: DiaryHeaderProps) => (
  <View className="gap-2 px-4 pb-2 pt-3">
    {patientName && <ThemedText type="subtitle">{`by ${patientName}`}</ThemedText>}

    <View className="flex-row flex-wrap items-center gap-2">
      {mode === 'view' ? (
        <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
          {completedAt
            ? `Completed ${new Date(completedAt).toLocaleDateString()}`
            : `Updated ${new Date(updatedAt).toLocaleDateString()}`}
        </ThemedText>
      ) : (
        <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
          {[
            startedAt && !hasDirtyChanges && `Started ${new Date(startedAt).toLocaleDateString()}`,
            updatedAt && `Updated ${new Date(updatedAt).toLocaleDateString()}`
          ]
            .filter(Boolean)
            .join(' · ')}
        </ThemedText>
      )}
      <SaveProgressChip saved={saved} isSaving={isSaving} />
      {moduleSnapshot?.disclaimer ? (
        <Pressable
          onPress={() => setDisclaimerOpen(!disclaimerOpen)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Safety information"
        >
          <MaterialCommunityIcons name="information-outline" size={20} color={Colors.sway.lightGrey} />
        </Pressable>
      ) : null}
    </View>

    {disclaimerOpen && moduleSnapshot?.disclaimer ? (
      <ThemedText style={{ fontSize: 12, color: Colors.sway.darkGrey, marginTop: 4 }}>
        {moduleSnapshot.disclaimer}
      </ThemedText>
    ) : null}
  </View>
);

export default memo(DiaryHeader);
