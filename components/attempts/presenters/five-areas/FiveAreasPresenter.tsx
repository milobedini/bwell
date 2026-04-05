import { ScrollView, View } from 'react-native';
import ContentContainer from '@/components/ContentContainer';
import ThemedButton from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import type { AttemptDetailResponseItem } from '@milobedini/shared-types';

import AreaReviewCard from './AreaReviewCard';
import AreaStep from './AreaStep';
import FiveAreasDiagram from './FiveAreasDiagram';
import { AREA_KEYS, useFiveAreasState } from './useFiveAreasState';

type FiveAreasPresenterProps = {
  attempt: AttemptDetailResponseItem;
  mode: 'view' | 'edit';
  patientName?: string;
};

const FiveAreasPresenter = ({ attempt, mode, patientName }: FiveAreasPresenterProps) => {
  const state = useFiveAreasState({ attempt, mode });

  // ── Review mode (patient post-submit or therapist reviewing) ──
  if (!state.canEdit || state.showReview) {
    return (
      <ContentContainer>
        {/* Header */}
        {patientName && (
          <ThemedText type="small" style={{ color: Colors.sway.darkGrey, marginBottom: 4 }}>
            {patientName}&apos;s entry
          </ThemedText>
        )}
        <ThemedText type="subtitle" style={{ marginBottom: 12 }}>
          5 Areas Model
        </ThemedText>

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
          onNodePress={state.canEdit ? state.goToStep : undefined}
        />

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
            <View className="flex-1">
              <ThemedButton
                title="Back"
                onPress={state.goBack}
                className="bg-sway-buttonBackgroundSolid"
                disabled={state.isSaving}
              />
            </View>
          )}
          <View className="flex-1">
            <ThemedButton
              title={state.currentStep === AREA_KEYS.length - 1 ? 'Review & Submit' : 'Next'}
              onPress={state.goForward}
              disabled={state.isSaving || !state.fields[state.currentKey]?.trim()}
            />
          </View>
        </View>
      </View>
    </ContentContainer>
  );
};

export default FiveAreasPresenter;
