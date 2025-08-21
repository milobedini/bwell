import { View } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import { AccessPolicy, AssignmentStatus } from '@/types/types';
import type { AvailableModulesItem } from '@milobedini/shared-types';

import ThemedButton from '../ThemedButton';
import { ThemedText } from '../ThemedText';
import { AccessPolicyChip, AssignmentStatusChip, CanStartChip, DueChip } from '../ui/Chip';

type ModulesListProps = {
  data: AvailableModulesItem[];
};

const ModulesList = ({ data }: ModulesListProps) => {
  const { id: programId } = useLocalSearchParams();

  return (
    <View>
      {data.map((item) => {
        const { module, meta } = item;
        // Todo, is assigned
        return (
          <View key={module._id} className="mb-6 gap-2 border-b border-b-sway-lightGrey pb-6">
            <View className="mb-4 flex-row items-center gap-2">
              <ThemedText type="subtitle">{module.title}</ThemedText>
              {/* Todo isAssigned Chip*/}
            </View>
            <View className="flex-row flex-wrap gap-2">
              <AssignmentStatusChip status={meta.assignmentStatus as AssignmentStatus} />
              <DueChip dueAt={meta.dueAt} />
              <AccessPolicyChip accessPolicy={module.accessPolicy as AccessPolicy} />
              <CanStartChip meta={meta} />
            </View>
            <ThemedText className=" text-lg">{module.description}</ThemedText>
            <ThemedText className="capitalize">{module.type}</ThemedText>
            <Link
              asChild
              push
              href={{
                pathname: '/programs/[id]/modules/[moduleId]',
                params: { id: programId as string, moduleId: module._id, headerTitle: module.title }
              }}
            >
              <ThemedButton>View Module</ThemedButton>
            </Link>
          </View>
        );
      })}
    </View>
  );
};

export default ModulesList;
