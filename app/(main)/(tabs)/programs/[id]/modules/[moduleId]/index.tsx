import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import ErrorComponent, { ErrorTypes } from '@/components/ErrorComponent';
import { LoadingIndicator } from '@/components/LoadingScreen';
import ScrollContainer from '@/components/ScrollContainer';
import ScrollContentContainer from '@/components/ScrollContentContainer';
import { ThemedText } from '@/components/ThemedText';
import { useModuleById } from '@/hooks/useModules';

const ModuleDetail = () => {
  const moduleId = useLocalSearchParams().moduleId;
  const { data, isPending, isError } = useModuleById(moduleId as string);

  if (isPending) {
    return <LoadingIndicator marginBottom={0} />;
  }

  if (isError || !data) {
    return <ErrorComponent errorType={ErrorTypes.NOT_FOUND} />;
  }

  const { module, questions, scoreBands } = data;

  return (
    <ScrollContainer>
      <ScrollContentContainer>
        <View className="border-b border-b-white ">
          <ThemedText>Module Detail: {module._id}</ThemedText>
          <ThemedText type="title">{module.title}</ThemedText>
          <ThemedText type="subtitle">{module.program.title} Program</ThemedText>
          <ThemedText>{module.description}</ThemedText>
          <ThemedText type="italic">{module.disclaimer}</ThemedText>
        </View>
        <View className="mt-4">
          {questions &&
            questions.map((question) => (
              <View key={question._id} className="my-2">
                <ThemedText type="smallTitle">
                  {question.order}) {question.text}
                </ThemedText>
                <View>
                  {question.choices.map((choice) => (
                    <ThemedText key={choice.text}>{choice.text}</ThemedText>
                  ))}
                </View>
              </View>
            ))}
        </View>
        <View className="mt-4">
          <ThemedText type="subtitle">Results meaning</ThemedText>
          {scoreBands &&
            scoreBands.map((band) => (
              <View key={band._id} className="my-2 border-b border-b-sway-lightGrey">
                <ThemedText>
                  Score {band.min} to {band.max} - {band.label}
                </ThemedText>
                <ThemedText>{band.interpretation}</ThemedText>
              </View>
            ))}
        </View>
      </ScrollContentContainer>
    </ScrollContainer>
  );
};

export default ModuleDetail;
