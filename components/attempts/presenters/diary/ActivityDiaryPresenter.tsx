import { useCallback } from 'react';
import { FlatList, KeyboardAvoidingView, ListRenderItemInfo, Platform } from 'react-native';
import type { SlotKey, SlotValue } from '@/utils/activityHelpers';
import type { AttemptDetailResponseItem, DiaryDetail } from '@milobedini/shared-types';

import DayNavBar from './DayNavBar';
import DiaryFooter from './DiaryFooter';
import DiaryHeader from './DiaryHeader';
import DiaryInputToolbar from './DiaryInputToolbar';
import SlotCard from './SlotCard';
import { refKey, useDiaryNavigation } from './useDiaryNavigation';
import { useDiaryState } from './useDiaryState';

type ActivityDiaryPresenterProps = {
  attempt: AttemptDetailResponseItem & { diary: DiaryDetail };
  mode: 'view' | 'edit';
  patientName?: string;
};

const DIARY_NAV_ID = 'diaryNav';

const ActivityDiaryPresenter = ({ attempt, mode, patientName }: ActivityDiaryPresenterProps) => {
  const state = useDiaryState({ attempt, mode });
  const nav = useDiaryNavigation(state.dayRows, state.activeDayISO);

  const renderSlot = useCallback(
    ({ item, index: slotIdx }: ListRenderItemInfo<{ key: SlotKey; value: SlotValue }>) => (
      <SlotCard
        slotKey={item.key}
        value={item.value}
        slotIdx={slotIdx}
        canEdit={state.canEdit}
        mode={mode}
        refKey={refKey}
        getRefCallback={nav.getRefCallback}
        setFocusedFieldIdx={nav.setFocusedFieldIdx}
        onUpdate={state.updateSlot}
      />
    ),
    [state.canEdit, state.updateSlot, mode, nav.getRefCallback, nav.setFocusedFieldIdx]
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.select({ ios: 120, default: 0 })}
    >
      <DayNavBar
        days={state.days}
        activeDayISO={state.activeDayISO}
        slotFillsByDay={state.slotFillsByDay}
        hasDirtyChanges={state.hasDirtyChanges}
        onSelectDay={state.setActiveDayISO}
        onSave={state.saveDirty}
      />

      <FlatList
        ref={nav.flatListRef}
        data={state.dayRows}
        keyExtractor={(row) => row.key}
        renderItem={renderSlot}
        getItemLayout={nav.getItemLayout}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            nav.flatListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.3 });
          }, 100);
        }}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
        removeClippedSubviews
        ListHeaderComponent={
          <DiaryHeader
            patientName={patientName}
            progress={state.progress}
            mode={mode}
            canEdit={state.canEdit}
            startedAt={state.startedAt}
            completedAt={state.completedAt}
            updatedAt={state.updatedAt}
            hasDirtyChanges={state.hasDirtyChanges}
            isSaving={state.isSaving}
            saved={state.saved}
            moduleSnapshot={state.moduleSnapshot}
            disclaimerOpen={state.disclaimerOpen}
            setDisclaimerOpen={state.setDisclaimerOpen}
            reflectionPrompt={state.reflectionPrompt}
            diary={state.diary}
            saveDirty={state.saveDirty}
          />
        }
        ListFooterComponent={
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
        }
      />

      {state.canEdit && (
        <DiaryInputToolbar
          nativeID={DIARY_NAV_ID}
          label={nav.toolbarLabel}
          canGoPrev={nav.focusedFieldIdx != null && nav.focusedFieldIdx > 0}
          canGoNext={nav.focusedFieldIdx != null && nav.focusedFieldIdx < nav.totalFields - 1}
          onPrev={() => {
            if (nav.focusedFieldIdx != null && nav.focusedFieldIdx > 0) {
              nav.focusField(nav.focusedFieldIdx - 1);
            }
          }}
          onNext={() => {
            if (nav.focusedFieldIdx != null && nav.focusedFieldIdx < nav.totalFields - 1) {
              nav.focusField(nav.focusedFieldIdx + 1);
            }
          }}
        />
      )}
    </KeyboardAvoidingView>
  );
};

export default ActivityDiaryPresenter;
