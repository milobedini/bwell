import { memo, useCallback } from 'react';
import { FlatList, View } from 'react-native';
import { Divider } from 'react-native-paper';
import { Link, useLocalSearchParams } from 'expo-router';
import { AccessPolicy } from '@/types/types';
import type { AssignmentStatus, AvailableModulesItem } from '@milobedini/shared-types';

import ThemedButton from '../ThemedButton';
import { ThemedText } from '../ThemedText';
import { AccessPolicyChip, AssignmentStatusChip, CanStartChip, DueChip } from '../ui/Chip';

type ModulesListProps = {
  data: AvailableModulesItem[];
};

type ModuleListItemProps = {
  item: AvailableModulesItem;
  programId: string;
};

const ModuleListItemBase = ({ item, programId }: ModuleListItemProps) => {
  const { module, meta } = item;
  return (
    <View key={module._id} className="gap-4 px-4">
      <View className="flex-row flex-wrap items-center gap-2">
        <ThemedText type="subtitle">{module.title}</ThemedText>
        <AssignmentStatusChip status={meta.assignmentStatus as AssignmentStatus} />
        {meta.dueAt && <DueChip dueAt={meta.dueAt} />}
      </View>
      <View className="gap-2">
        <ThemedText className="uppercase">Access Policy</ThemedText>
        <View className="flex-row flex-wrap gap-2">
          <AccessPolicyChip accessPolicy={module.accessPolicy as AccessPolicy} />
          <CanStartChip meta={meta} />
        </View>
      </View>
      <ThemedText>{module.description}</ThemedText>
      <ThemedText type="italic" className="capitalize">
        {module.type}
      </ThemedText>
      <Link
        asChild
        push
        href={{
          pathname: '/programs/[id]/modules/[moduleId]',
          params: { id: programId, moduleId: module._id, headerTitle: module.title }
        }}
      >
        <ThemedButton>Preview</ThemedButton>
      </Link>
    </View>
  );
};

const ModuleListItem = memo(ModuleListItemBase);

const ModuleListSeparator = () => <Divider bold className="my-4" />;

const ModulesList = ({ data }: ModulesListProps) => {
  const { id: programId } = useLocalSearchParams();

  const renderItem = useCallback(
    ({ item }: { item: AvailableModulesItem }) => <ModuleListItem item={item} programId={programId as string} />,
    [programId]
  );

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.module._id}
      ItemSeparatorComponent={ModuleListSeparator}
      renderItem={renderItem}
    />
  );
};

export default ModulesList;
