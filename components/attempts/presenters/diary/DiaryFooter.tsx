import { memo } from 'react';
import { TextInput, View } from 'react-native';
import ThemedButton from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';

type DiaryFooterProps = {
  mode: 'view' | 'edit';
  canEdit: boolean;
  userNoteText: string;
  setUserNoteText: (text: string) => void;
  setNoteDirty: (dirty: boolean) => void;
  userNote?: string;
  allAnswered: boolean;
  hasDirtyChanges: boolean;
  onSubmitOrExit: () => void;
  onDiscard: () => void;
};

const DiaryFooter = ({
  mode,
  canEdit,
  userNoteText,
  setUserNoteText,
  setNoteDirty,
  userNote,
  allAnswered,
  hasDirtyChanges,
  onSubmitOrExit,
  onDiscard
}: DiaryFooterProps) => (
  <View className="pb-6 pt-4">
    {/* Therapist note */}
    {canEdit ? (
      <View style={{ backgroundColor: Colors.chip.darkCard, borderRadius: 12, padding: 14, marginBottom: 12 }}>
        <ThemedText style={{ color: Colors.sway.lightGrey, fontSize: 13, fontWeight: '700', marginBottom: 10 }}>
          Note to Therapist
        </ThemedText>
        <View
          style={{
            backgroundColor: Colors.sway.dark,
            borderRadius: 8,
            padding: 12,
            minHeight: 60,
            borderWidth: 1,
            borderColor: Colors.chip.pill
          }}
        >
          <TextInput
            value={userNoteText}
            onChangeText={(t) => {
              setUserNoteText(t);
              setNoteDirty(true);
            }}
            placeholder="Anything you'd like your therapist to know this week..."
            placeholderTextColor={Colors.chip.dotInactive}
            style={{ color: Colors.sway.lightGrey, fontSize: 13, padding: 0 }}
            multiline
            maxLength={500}
          />
        </View>
        <ThemedText
          type="small"
          style={{
            textAlign: 'right',
            marginTop: 6,
            color: userNoteText.length >= 450 ? Colors.primary.error : Colors.chip.dotInactive,
            fontSize: 10
          }}
        >
          {`${userNoteText.length} / 500`}
        </ThemedText>
      </View>
    ) : userNote ? (
      <View style={{ backgroundColor: Colors.chip.darkCard, borderRadius: 12, padding: 14, marginBottom: 12 }}>
        <ThemedText style={{ color: Colors.sway.lightGrey, fontSize: 13, fontWeight: '700', marginBottom: 10 }}>
          Patient Note
        </ThemedText>
        <ThemedText style={{ color: Colors.sway.lightGrey, fontSize: 13 }}>{userNote}</ThemedText>
      </View>
    ) : null}

    {/* Action buttons */}
    {mode === 'edit' ? (
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <ThemedButton
            title={hasDirtyChanges ? 'Save Draft' : 'Exit'}
            onPress={hasDirtyChanges ? onSubmitOrExit : onDiscard}
            variant="outline"
          />
        </View>
        <View style={{ flex: 1 }}>
          <ThemedButton title="Submit" onPress={onSubmitOrExit} disabled={!allAnswered} />
        </View>
      </View>
    ) : (
      <ThemedButton title="Exit" onPress={onDiscard} variant="outline" />
    )}
  </View>
);

export default memo(DiaryFooter);
