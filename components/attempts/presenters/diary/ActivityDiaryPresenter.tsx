import { useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { isSlotComplete, isSlotFilled, type SlotKey, type SlotValue } from '@/utils/activityHelpers';
import type { AttemptDetailResponseItem, DiaryDetail } from '@milobedini/shared-types';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

import DayRingBar from './DayRingBar';
import DiaryFooter from './DiaryFooter';
import DiaryHeader from './DiaryHeader';
import SlotAccordionPanel from './SlotAccordionPanel';
import SlotAccordionRow from './SlotAccordionRow';
import { useDiaryNavigation } from './useDiaryNavigation';
import { useDiaryState } from './useDiaryState';
import WeeklySummary from './WeeklySummary';

const TOTAL_SLOTS = 9;

type ActivityDiaryPresenterProps = {
  attempt: AttemptDetailResponseItem & { diary: DiaryDetail };
  mode: 'view' | 'edit';
  patientName?: string;
};

const ActivityDiaryPresenter = ({ attempt, mode, patientName }: ActivityDiaryPresenterProps) => {
  const state = useDiaryState({ attempt, mode });
  const nav = useDiaryNavigation(state.activeDayISO);

  const promptShownRef = useRef(false);

  const handleSelectDay = useCallback(
    (iso: string) => {
      if (state.hasDirtyChanges) state.saveDirty();
      state.setActiveDayISO(iso);
    },
    [state]
  );

  const handleSlotUpdate = useCallback(
    (key: SlotKey, patch: Partial<SlotValue>) => {
      state.updateSlot(key, patch);
    },
    [state]
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.select({ ios: 120, default: 0 })}
    >
      <DayRingBar
        days={state.days}
        activeDayISO={state.activeDayISO}
        slotFillCounts={state.slotFillCounts}
        totalSlots={TOTAL_SLOTS}
        onSelectDay={handleSelectDay}
      />

      <View className="flex-1">
        {(state.hasDirtyChanges || state.isSaving || state.saved) && (
          <Pressable
            style={floatingStyles.container}
            onPress={state.saveDirty}
            disabled={state.isSaving || !state.hasDirtyChanges}
            accessibilityRole="button"
            accessibilityLabel={state.isSaving ? 'Saving' : state.hasDirtyChanges ? 'Save changes' : 'Saved'}
            hitSlop={8}
          >
            {state.isSaving ? (
              <ActivityIndicator size="small" color={Colors.sway.bright} />
            ) : state.hasDirtyChanges ? (
              <MaterialCommunityIcons name="content-save-edit-outline" size={16} color={Colors.primary.warning} />
            ) : (
              <MaterialCommunityIcons name="check-circle-outline" size={16} color={Colors.primary.success} />
            )}
          </Pressable>
        )}

        <ScrollView className="flex-1 bg-sway-dark" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4 }}>
          <DiaryHeader
            patientName={patientName}
            updatedAt={state.updatedAt}
            moduleSnapshot={state.moduleSnapshot}
            disclaimerOpen={state.disclaimerOpen}
            setDisclaimerOpen={state.setDisclaimerOpen}
          />

          <View style={{ gap: 6, paddingBottom: 8 }}>
            {state.dayRows.map((row, slotIdx) => {
              const isExpanded = nav.expandedSlotIdx === slotIdx;
              const filled = isSlotFilled(row.value);
              const complete = isSlotComplete(row.value);

              // Show reflection prompt on the first slot opened this session (edit mode only).
              // Use a ref so the check happens during render before React batches the state update.
              const showPrompt = isExpanded && !promptShownRef.current && mode === 'edit';
              if (isExpanded && !promptShownRef.current) {
                promptShownRef.current = true;
              }

              if (isExpanded) {
                return (
                  <SlotAccordionPanel
                    key={row.key}
                    label={row.value.label}
                    activity={row.value.activity}
                    mood={row.value.mood}
                    achievement={row.value.achievement}
                    closeness={row.value.closeness}
                    enjoyment={row.value.enjoyment}
                    isFilled={filled}
                    isComplete={complete}
                    canEdit={state.canEdit}
                    showReflectionPrompt={showPrompt}
                    reflectionPrompt={state.reflectionPrompt}
                    onActivityChange={(text) => handleSlotUpdate(row.key, { activity: text })}
                    onMoodChange={(value) => handleSlotUpdate(row.key, { mood: value })}
                    onStepperChange={(field, value) => handleSlotUpdate(row.key, { [field]: value })}
                    onCollapse={nav.collapseSlot}
                  />
                );
              }

              return (
                <SlotAccordionRow
                  key={row.key}
                  label={row.value.label}
                  activityPreview={row.value.activity}
                  isFilled={filled}
                  onPress={() => nav.expandSlot(slotIdx)}
                />
              );
            })}
          </View>

          <WeeklySummary totals={state.diary.totals} defaultOpen={mode === 'view'} />

          <DiaryFooter
            mode={mode}
            canEdit={state.canEdit}
            userNoteText={state.userNoteText}
            setUserNoteText={state.setUserNoteText}
            setNoteDirty={state.setNoteDirty}
            userNote={state.userNote}
            allAnswered={state.allAnswered}
            hasDirtyChanges={state.hasDirtyChanges}
            onSubmitOrExit={state.handleSubmitOrExit}
            onDiscard={state.router.back}
          />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const floatingStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 8,
    right: 20,
    zIndex: 10,
    backgroundColor: Colors.chip.darkCard,
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.chip.darkCardAlt
  }
});

export default ActivityDiaryPresenter;
