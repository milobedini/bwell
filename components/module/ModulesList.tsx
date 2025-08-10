import { useCallback } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import type { Module } from '@milobedini/shared-types';

import ThemedButton from '../ThemedButton';
import { ThemedText } from '../ThemedText';
import { EnrolledChip } from '../ui/Chip';

type ModulesListProps = {
  modules: Module[];
};

const ModulesList = ({ modules }: ModulesListProps) => {
  const userId = useAuthStore((s) => s.user?._id);
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const handleModulePress = useCallback(
    (moduleId: string) => {
      router.push(`/programs/${id}/modules/${moduleId}`);
    },
    [id, router]
  );

  return (
    <>
      {modules.map((module) => {
        const isEnrolled = userId && module.enrolled?.includes(userId);
        return (
          <View key={module._id} className="mb-4 mt-6">
            <View className="mb-4 flex-row items-center gap-2">
              <ThemedText type="subtitle">{module.title}</ThemedText>
              {isEnrolled && <EnrolledChip />}
            </View>
            <ThemedText className="mb-2">{module.description}</ThemedText>
            <ThemedText className="mb-2 capitalize">{module.type}</ThemedText>
            <ThemedButton onPress={() => handleModulePress(module._id)}>View Module</ThemedButton>
          </View>
        );
      })}
    </>
  );
};

export default ModulesList;
