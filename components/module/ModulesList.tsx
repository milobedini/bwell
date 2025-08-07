import { useCallback } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Module } from '@milobedini/shared-types';

import ThemedButton from '../ThemedButton';
import { ThemedText } from '../ThemedText';

type ModulesListProps = {
  modules: Module[];
};

const ModulesList = ({ modules }: ModulesListProps) => {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const handleModulePress = useCallback(
    (moduleId: string) => {
      // Navigate to module detail page
      router.push(`/programs/${id}/modules/${moduleId}`);
    },
    [id, router]
  );

  return (
    <>
      {modules.map((module) => (
        <View key={module._id} className="mt-4">
          <ThemedText type="subtitle">{module.title}</ThemedText>
          <ThemedText>{module.description}</ThemedText>
          <ThemedText>{module.type}</ThemedText>
          <ThemedButton onPress={() => handleModulePress(module._id)}>View Module</ThemedButton>
        </View>
      ))}
    </>
  );
};

export default ModulesList;
