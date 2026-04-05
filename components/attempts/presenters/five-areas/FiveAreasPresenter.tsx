import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import ContentContainer from '@/components/ContentContainer';
import ThemedButton from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import type { AttemptDetailResponseItem } from '@milobedini/shared-types';

import AreaReviewCard from './AreaReviewCard';
import AreaStep from './AreaStep';
import FiveAreasDiagram from './FiveAreasDiagram';
import { AREA_KEYS, AREA_LABELS, type AreaKey, useFiveAreasState } from './useFiveAreasState';

type FiveAreasPresenterProps = {
  attempt: AttemptDetailResponseItem;
  mode: 'view' | 'edit';
  patientName?: string;
};

const FiveAreasPresenter = ({ attempt, mode }: FiveAreasPresenterProps) => {
  const state = useFiveAreasState({ attempt, mode });
  const [tooltipKey, setTooltipKey] = useState<AreaKey | null>(null);

  const handleNodePress = useCallback(
    (step: number) => {
      if (state.canEdit) {
        state.goToStep(step);
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

        {/* Diagram with snippets + tooltip */}
        <View>
          <FiveAreasDiagram
            currentStep={state.currentStep}
            completedSteps={state.completedSteps}
            snippets={state.fields}
            mode="view"
            onNodePress={handleNodePress}
          />

          {/* Tooltip overlay */}
          {tooltipKey && (
            <Pressable onPress={dismissTooltip} className="absolute inset-0 items-center justify-center">
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
        </View>

        {/* Full text cards */}
        <ScrollView className="mt-4" contentContainerStyle={{ paddingBottom: 40 }}>
          {AREA_KEYS.map((key) => (
            <AreaReviewCard key={key} areaKey={key} value={state.fields[key] ?? ''} />
          ))}

          {/* User note */}
          {attempt.userNote && (
            <View className="mt-2">
              <ThemedText type="smallBold" style={{ marginBottom: 6 }}>
                Personal Note
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

  // ── Edit mode (stepped flow) ──
  return (
    <ContentContainer padded={false}>
      <View className="flex-1">
        {/* Diagram */}
        <View className="px-4 pt-2">
          <FiveAreasDiagram
            currentStep={state.currentStep}
            completedSteps={state.completedSteps}
            onNodePress={state.goToStep}
            mode="edit"
          />
        </View>

        {/* Step indicator */}
        <View className="px-4 pb-2 pt-1">
          <ThemedText type="small" style={{ color: Colors.sway.darkGrey, textAlign: 'center' }}>
            Step {state.currentStep + 1} of {AREA_KEYS.length}
          </ThemedText>
        </View>

        {/* Current area input */}
        <AreaStep
          areaKey={state.currentKey}
          value={state.fields[state.currentKey] ?? ''}
          onChangeText={(text) => state.updateField(state.currentKey, text)}
          editable
        />

        {/* Navigation buttons */}
        <View className="flex-row gap-3 px-4 pb-6 pt-4">
          {state.currentStep > 0 && (
            <Pressable
              className="flex-1 items-center rounded-md p-4 active:opacity-70"
              style={{
                backgroundColor: 'transparent',
                borderWidth: 1.5,
                borderColor: Colors.sway.bright
              }}
              onPress={state.goBack}
              disabled={state.isSaving}
            >
              <ThemedText type="button" style={{ color: Colors.sway.bright }}>
                Back
              </ThemedText>
            </Pressable>
          )}
          <Pressable
            className="flex-1 items-center rounded-md p-4 active:opacity-70 disabled:opacity-40"
            style={{
              backgroundColor:
                state.isSaving || !state.fields[state.currentKey]?.trim() ? Colors.sway.darkGrey : Colors.sway.bright
            }}
            onPress={state.goForward}
            disabled={state.isSaving || !state.fields[state.currentKey]?.trim()}
          >
            <ThemedText type="button">{state.currentStep === AREA_KEYS.length - 1 ? 'Review' : 'Next'}</ThemedText>
          </Pressable>
        </View>
      </View>
    </ContentContainer>
  );
};

export default FiveAreasPresenter;
