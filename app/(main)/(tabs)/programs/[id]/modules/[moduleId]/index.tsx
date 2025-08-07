import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import ErrorComponent, { ErrorTypes } from '@/components/ErrorComponent';
import { LoadingIndicator } from '@/components/LoadingScreen';
import ModuleSummary from '@/components/module/ModuleSummary';
import QuestionsPresenter from '@/components/module/QuestionsPresenter';
import ScoreBandsPresenter from '@/components/module/ScoreBandsPresenter';
import ScrollContainer from '@/components/ScrollContainer';
import ScrollContentContainer from '@/components/ScrollContentContainer';
import ThemedButton from '@/components/ThemedButton';
import { useModuleById } from '@/hooks/useModules';
import useToggle from '@/hooks/useToggle';
import { ModuleType } from '@/types/types';

const ModuleDetail = () => {
  const moduleId = useLocalSearchParams().moduleId;
  const { data, isPending, isError } = useModuleById(moduleId as string);
  const [open, toggleOpen] = useToggle(false);

  if (isPending) return <LoadingIndicator marginBottom={0} />;

  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;

  if (!data) return <ErrorComponent errorType={ErrorTypes.NO_CONTENT} />;

  const { module, questions, scoreBands } = data;

  return (
    <ScrollContainer>
      <ScrollContentContainer>
        {/* Module Summary */}
        <View className="gap-2">
          <ModuleSummary module={module} />
          <ThemedButton onPress={toggleOpen}>{open ? 'Close module' : 'Take module'}</ThemedButton>
        </View>
        {/* Button to actually begin module, for now just show and hide toggle. */}
        {/* Todo - separate switch cases for module types, below is all questionnaire based. */}
        {/* Main Content */}
        {open && (
          <>
            <View className="mt-4">
              {module.type === ModuleType.QUESTIONNAIRE && questions && !!questions.length && (
                <QuestionsPresenter questions={questions} />
              )}
            </View>
            {/* Helper Content */}
            <View className="mt-4">
              {scoreBands && !!scoreBands.length && <ScoreBandsPresenter scoreBands={scoreBands} />}
            </View>
          </>
        )}
      </ScrollContentContainer>
    </ScrollContainer>
  );
};

export default ModuleDetail;
