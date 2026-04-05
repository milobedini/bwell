import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { AnimatePresence, MotiView } from 'moti';
import ContentContainer from '@/components/ContentContainer';
import ThemedButton from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import type { AttemptDetailResponseItem } from '@milobedini/shared-types';

import AreaInputModal from './AreaInputModal';
import AreaReviewCard from './AreaReviewCard';
import FiveAreasDiagram from './FiveAreasDiagram';
import { AREA_KEYS, AREA_LABELS, type AreaKey, useFiveAreasState } from './useFiveAreasState';

type FiveAreasPresenterProps = {
  attempt: AttemptDetailResponseItem;
  mode: 'view' | 'edit';
  patientName?: string;
};

const FiveAreasPresenter = ({ attempt, mode, patientName }: FiveAreasPresenterProps) => {
  const state = useFiveAreasState({ attempt, mode });
  const [tooltipKey, setTooltipKey] = useState<AreaKey | null>(null);

  const handleNodePress = useCallback(
    (step: number) => {
      if (state.canEdit) {
        state.openModal(step);
        return;
      }
      const key = AREA_KEYS[step];
      setTooltipKey((prev) => (prev === key ? null : key));
    },
    [state]
  );

  const dismissTooltip = useCallback(() => setTooltipKey(null), []);

  // ── Review mode (patient post-submit or therapist reviewing) ──
  if (!state.canEdit || state.showReview) {
    return (
      <ContentContainer>
        {/* In-progress indicator for therapist */}
        {mode === 'view' && attempt.status !== 'submitted' && (
          <View
            className="mb-4 rounded-lg p-3"
            style={{
              backgroundColor: Colors.tint.info,
              borderColor: Colors.primary.info,
              borderWidth: 1
            }}
          >
            <ThemedText type="small" style={{ color: Colors.primary.info }}>
              This entry is still in progress.
            </ThemedText>
          </View>
        )}

        {/* Diagram with snippets */}
        <FiveAreasDiagram
          currentStep={state.currentStep}
          completedSteps={state.completedSteps}
          snippets={state.fields}
          mode="view"
          onNodePress={handleNodePress}
        />

        {/* Tooltip overlay — covers entire screen so taps outside dismiss */}
        {tooltipKey && (
          <Pressable onPress={dismissTooltip} className="absolute inset-0 z-10 items-center justify-center">
            <View
              className="mx-6 rounded-xl p-4"
              style={{
                backgroundColor: Colors.chip.darkCard,
                borderWidth: 1,
                borderColor: Colors.sway.bright,
                maxWidth: 300
              }}
            >
              <ThemedText type="smallBold" style={{ color: Colors.sway.bright, marginBottom: 6 }}>
                {AREA_LABELS[tooltipKey]}
              </ThemedText>
              <ThemedText>{state.fields[tooltipKey] || '—'}</ThemedText>
            </View>
          </Pressable>
        )}

        {/* Full text cards */}
        <ScrollView className="mt-4" contentContainerStyle={{ paddingBottom: 40 }}>
          {AREA_KEYS.map((key, index) => (
            <AreaReviewCard
              key={key}
              areaKey={key}
              value={state.fields[key] ?? ''}
              onPress={state.canEdit ? () => state.openModal(index) : undefined}
            />
          ))}

          {/* User note */}
          {attempt.userNote && (
            <View className="mt-2">
              <ThemedText type="smallBold" style={{ marginBottom: 6 }}>
                {patientName ? `${patientName}'s Note` : 'Personal Note'}
              </ThemedText>
              <View className="rounded-xl p-4" style={{ backgroundColor: Colors.chip.darkCard }}>
                <ThemedText>{attempt.userNote}</ThemedText>
              </View>
            </View>
          )}

          {/* Submit button (only in review-before-submit) */}
          {state.canEdit && state.showReview && (
            <View className="mt-6">
              <ThemedButton
                title={state.isSubmitting ? 'Submitting...' : 'Submit'}
                onPress={state.handleSubmit}
                disabled={state.isSubmitting}
              />
            </View>
          )}
        </ScrollView>
      </ContentContainer>
    );
  }

  // ── Edit mode (two-state: diagram idle vs modal open) ──
  return (
    <ContentContainer padded={false}>
      <View className="flex-1">
        {/* Diagram — always rendered, dimmed when modal is open */}
        <View className="px-4 pt-2">
          <FiveAreasDiagram
            currentStep={state.currentStep}
            completedSteps={state.completedSteps}
            onNodePress={handleNodePress}
            mode="edit"
            dimmed={state.modalOpen}
          />
        </View>

        {/* Idle state: prompt + optional review button */}
        {!state.modalOpen && (
          <View className="items-center px-4 pt-2">
            <ThemedText type="small" style={{ color: Colors.sway.darkGrey, textAlign: 'center' }}>
              Tap any area to edit
            </ThemedText>

            {state.completedSteps.size === AREA_KEYS.length && (
              <View className="mt-4 w-full">
                <ThemedButton title="Review & Submit" onPress={state.goToReview} disabled={state.isSaving} />
              </View>
            )}
          </View>
        )}

        {/* Modal overlay */}
        <AnimatePresence>
          {state.modalOpen && (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'timing', duration: 250 }}
              className="absolute inset-0 bg-sway-dark"
            >
              <AreaInputModal
                areaKey={state.currentKey}
                currentStep={state.currentStep}
                value={state.fields[state.currentKey] ?? ''}
                onChangeText={(text) => state.updateField(state.currentKey, text)}
                onNext={state.goForward}
                onBack={state.goBack}
                onClose={state.closeModal}
                isSaving={state.isSaving}
              />
            </MotiView>
          )}
        </AnimatePresence>
      </View>
    </ContentContainer>
  );
};

export default FiveAreasPresenter;
