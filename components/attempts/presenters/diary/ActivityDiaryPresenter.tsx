import { useCallback, useRef } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { isSlotComplete, isSlotFilled, type SlotKey, type SlotValue } from '@/utils/activityHelpers';
import type { AttemptDetailResponseItem, DiaryDetail } from '@milobedini/shared-types';

import DayRingBar from './DayRingBar';
import DiaryFooter from './DiaryFooter';
import DiaryHeader from './DiaryHeader';
import SlotAccordionPanel from './SlotAccordionPanel';
import SlotAccordionRow from './SlotAccordionRow';
import { useDiaryNavigation } from './useDiaryNavigation';
import { useDiaryState } from './useDiaryState';
import WeeklySummary from './WeeklySummary';

const TOTAL_SLOTS = 9;
const AUTO_ADVANCE_DELAY = 500;

type ActivityDiaryPresenterProps = {
  attempt: AttemptDetailResponseItem & { diary: DiaryDetail };
  mode: 'view' | 'edit';
  patientName?: string;
};

const ActivityDiaryPresenter = ({ attempt, mode, patientName }: ActivityDiaryPresenterProps) => {
  const state = useDiaryState({ attempt, mode });
  const nav = useDiaryNavigation(state.activeDayISO);

  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const promptShownRef = useRef(false);

  const handleSelectDay = useCallback(
    (iso: string) => {
      if (state.hasDirtyChanges) state.saveDirty();
      state.setActiveDayISO(iso);
    },
    [state]
  );

  const handleExpandSlot = useCallback(
    (slotIdx: number) => {
      nav.expandSlot(slotIdx);
    },
    [nav]
  );

  const handleCollapseSlot = useCallback(() => {
    nav.collapseSlot();
  }, [nav]);

  const scheduleAutoAdvance = useCallback(
    (currentSlotIdx: number) => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = setTimeout(() => {
        const nextIdx = state.dayRows.findIndex((row, idx) => idx > currentSlotIdx && !isSlotComplete(row.value));
        if (nextIdx >= 0) {
          nav.expandSlot(nextIdx);
        } else {
          nav.collapseSlot();
        }
      }, AUTO_ADVANCE_DELAY);
    },
    [state.dayRows, nav]
  );

  const handleSlotUpdate = useCallback(
    (key: SlotKey, patch: Partial<SlotValue>, slotIdx: number) => {
      state.updateSlot(key, patch);

      if (mode === 'edit') {
        const currentValue = state.dayRows[slotIdx]?.value;
        if (currentValue) {
          const merged = { ...currentValue, ...patch };
          if (isSlotComplete(merged)) {
            scheduleAutoAdvance(slotIdx);
          }
        }
      }
    },
    [state, mode, scheduleAutoAdvance]
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

      <ScrollView className="flex-1 bg-sway-dark" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4 }}>
        <DiaryHeader
          patientName={patientName}
          mode={mode}
          startedAt={state.startedAt}
          completedAt={state.completedAt}
          updatedAt={state.updatedAt}
          hasDirtyChanges={state.hasDirtyChanges}
          isSaving={state.isSaving}
          saved={state.saved}
          moduleSnapshot={state.moduleSnapshot}
          disclaimerOpen={state.disclaimerOpen}
          setDisclaimerOpen={state.setDisclaimerOpen}
        />

        {/* Accordion slots */}
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
                  onActivityChange={(text) => handleSlotUpdate(row.key, { activity: text }, slotIdx)}
                  onMoodChange={(value) => handleSlotUpdate(row.key, { mood: value }, slotIdx)}
                  onStepperChange={(field, value) => handleSlotUpdate(row.key, { [field]: value }, slotIdx)}
                  onCollapse={handleCollapseSlot}
                />
              );
            }

            return (
              <SlotAccordionRow
                key={row.key}
                label={row.value.label}
                activityPreview={row.value.activity}
                isFilled={filled}
                onPress={() => handleExpandSlot(slotIdx)}
              />
            );
          })}
        </View>

        {/* Weekly summary */}
        <WeeklySummary totals={state.diary.totals} defaultOpen={mode === 'view'} />

        {/* Footer */}
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
    </KeyboardAvoidingView>
  );
};

export default ActivityDiaryPresenter;
