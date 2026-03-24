import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { Chip } from 'react-native-paper';
import { ThemedText } from '@/components/ThemedText';
import { SaveProgressChip } from '@/components/ui/Chip';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import type { DiaryDetail, ModuleSnapshot } from '@milobedini/shared-types';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

import ReflectionPrompt from './ReflectionPrompt';
import WeeklySummary from './WeeklySummary';

type DiaryHeaderProps = {
  patientName?: string;
  progress: number;
  mode: 'view' | 'edit';
  canEdit: boolean;
  startedAt?: string;
  completedAt?: string;
  updatedAt: string;
  hasDirtyChanges: boolean;
  isSaving: boolean;
  saved: boolean;
  moduleSnapshot?: ModuleSnapshot;
  disclaimerOpen: boolean;
  setDisclaimerOpen: (open: boolean) => void;
  reflectionPrompt: string;
  diary: DiaryDetail;
  saveDirty: () => void;
};

const DiaryHeader = ({
  patientName,
  progress,
  mode,
  canEdit,
  startedAt,
  completedAt,
  updatedAt,
  hasDirtyChanges,
  isSaving,
  saved,
  moduleSnapshot,
  disclaimerOpen,
  setDisclaimerOpen,
  reflectionPrompt,
  diary,
  saveDirty
}: DiaryHeaderProps) => (
  <View className="gap-3 px-4 pb-3 pt-3">
    {patientName && <ThemedText type="subtitle">{`by ${patientName}`}</ThemedText>}

    <View className="flex-row flex-wrap items-center gap-2">
      <Chip
        style={{ backgroundColor: Colors.sway.bright }}
        textStyle={{ color: Colors.sway.dark, fontFamily: Fonts.Bold }}
      >
        {`${Math.round(progress * 100)}%`}
      </Chip>
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
      {hasDirtyChanges && (
        <Chip
          icon={() => <MaterialCommunityIcons name="content-save" size={24} color={Colors.chip.green} />}
          mode="outlined"
          textStyle={{ fontFamily: Fonts.Black, color: Colors.chip.green }}
          style={{ backgroundColor: Colors.sway.buttonBackground, borderColor: Colors.chip.greenBorder }}
          onPress={saveDirty}
        >
          Save changes
        </Chip>
      )}
    </View>

    {disclaimerOpen && moduleSnapshot?.disclaimer ? (
      <ThemedText style={{ fontSize: 12, color: Colors.sway.darkGrey, marginTop: 4 }}>
        {moduleSnapshot.disclaimer}
      </ThemedText>
    ) : null}

    {canEdit && <ReflectionPrompt prompt={reflectionPrompt} />}

    <WeeklySummary totals={diary.totals} />
  </View>
);

export default memo(DiaryHeader);
