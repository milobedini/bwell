import { memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { timeAgo } from '@/utils/dates';
import type { ModuleSnapshot } from '@milobedini/shared-types';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

type DiaryHeaderProps = {
  patientName?: string;
  updatedAt: string;
  moduleSnapshot?: ModuleSnapshot;
  disclaimerOpen: boolean;
  setDisclaimerOpen: (open: boolean) => void;
};

const DiaryHeader = ({
  patientName,
  updatedAt,
  moduleSnapshot,
  disclaimerOpen,
  setDisclaimerOpen
}: DiaryHeaderProps) => {
  const lastSaved = useMemo(() => timeAgo(updatedAt), [updatedAt]);
  const label = lastSaved.relative ? `Last saved ${lastSaved.relative}` : `Last saved ${lastSaved.formatted}`;

  return (
    <View className="gap-2 px-4 pb-2 pt-3">
      {patientName && <ThemedText type="subtitle">{`by ${patientName}`}</ThemedText>}

      <View className="flex-row flex-wrap items-center gap-2">
        <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
          {label}
        </ThemedText>

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
};

export default memo(DiaryHeader);
