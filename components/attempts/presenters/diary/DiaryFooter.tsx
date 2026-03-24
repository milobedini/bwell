import { memo } from 'react';
import { View } from 'react-native';
import { Card, TextInput } from 'react-native-paper';
import { PrimaryButton } from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';

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

const NoteCardEdit = ({
  userNoteText,
  setUserNoteText,
  setNoteDirty
}: Pick<DiaryFooterProps, 'userNoteText' | 'setUserNoteText' | 'setNoteDirty'>) => (
  <Card style={{ backgroundColor: Colors.sway.buttonBackground, marginBottom: 10, marginHorizontal: 8 }}>
    <Card.Title title="Note for therapist" titleStyle={{ color: 'white', fontFamily: Fonts.Bold }} />
    <Card.Content>
      <TextInput
        mode="flat"
        placeholder="Anything you'd like your therapist to know this week..."
        placeholderTextColor={Colors.sway.darkGrey}
        value={userNoteText}
        onChangeText={(t) => {
          setUserNoteText(t);
          setNoteDirty(true);
        }}
        multiline
        maxLength={500}
        style={{ backgroundColor: 'transparent', minHeight: 64 }}
        className="overflow-hidden text-ellipsis border border-sway-darkGrey text-white"
        textColor="white"
        underlineColor="transparent"
        activeUnderlineColor={Colors.sway.bright}
        theme={{ colors: { onSurfaceVariant: Colors.sway.lightGrey } }}
        clearButtonMode="always"
      />
      <ThemedText
        type="small"
        style={{
          textAlign: 'right',
          marginTop: 4,
          color: userNoteText.length >= 450 ? Colors.primary.error : Colors.sway.darkGrey
        }}
      >
        {`${userNoteText.length}/500`}
      </ThemedText>
    </Card.Content>
  </Card>
);

const NoteCardView = ({ userNote }: { userNote: string }) => (
  <Card style={{ backgroundColor: Colors.sway.buttonBackground, marginBottom: 10, marginHorizontal: 8 }}>
    <Card.Title title="Patient note" titleStyle={{ color: 'white', fontFamily: Fonts.Bold }} />
    <Card.Content>
      <ThemedText style={{ color: Colors.sway.lightGrey }}>{userNote}</ThemedText>
    </Card.Content>
  </Card>
);

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
  <View>
    {canEdit ? (
      <NoteCardEdit userNoteText={userNoteText} setUserNoteText={setUserNoteText} setNoteDirty={setNoteDirty} />
    ) : userNote ? (
      <NoteCardView userNote={userNote} />
    ) : null}

    {mode === 'edit' && (
      <View className="gap-3 pb-2">
        <PrimaryButton
          className="mb-2"
          title={allAnswered ? 'Submit diary' : hasDirtyChanges ? 'Save & Exit' : 'Exit'}
          onPress={onSubmitOrExit}
        />
        {hasDirtyChanges && <PrimaryButton title="Discard changes" onPress={onDiscard} variant="error" />}
      </View>
    )}

    {mode !== 'edit' && <PrimaryButton className="mb-2" title="Exit" onPress={onDiscard} />}
  </View>
);

export default memo(DiaryFooter);
