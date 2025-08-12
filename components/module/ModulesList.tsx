import { useCallback } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { AccessPolicy } from '@/types/types';
import type { Module } from '@milobedini/shared-types';

import ThemedButton from '../ThemedButton';
import { ThemedText } from '../ThemedText';
import { AccessPolicyChip, EnrolledChip } from '../ui/Chip';

type ModulesListProps = {
  modules: Module[];
};

const ModulesList = ({ modules }: ModulesListProps) => {
  const userId = useAuthStore((s) => s.user?._id);
  const { id: programId } = useLocalSearchParams();
  const router = useRouter();

  const handleModulePress = useCallback(
    (module: Module) => {
      router.push({
        pathname: '/programs/[id]/modules/[moduleId]',
        params: { id: programId as string, moduleId: module._id, headerTitle: module.title }
      });
    },
    [router, programId]
  );

  return (
    <View>
      {modules.map((module) => {
        const isEnrolled = userId && module.enrolled?.includes(userId);
        return (
          <View key={module._id} className="mb-6 gap-2 border-b border-b-sway-lightGrey pb-6">
            <View className="mb-4 flex-row items-center gap-2">
              <ThemedText type="subtitle">{module.title}</ThemedText>
              {isEnrolled && <EnrolledChip />}
            </View>
            <View className="w-1/2">
              <AccessPolicyChip accessPolicy={module.accessPolicy as AccessPolicy} />
            </View>
            <ThemedText className=" text-lg">{module.description}</ThemedText>
            <ThemedText className="capitalize">{module.type}</ThemedText>
            <ThemedButton onPress={() => handleModulePress(module)}>View Module</ThemedButton>
          </View>
        );
      })}
    </View>
  );
};

export default ModulesList;
