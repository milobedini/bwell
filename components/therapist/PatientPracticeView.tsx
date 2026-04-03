import { memo, useCallback, useState } from 'react';
import { RefreshControl, SectionList, type SectionListData, type SectionListRenderItemInfo, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useRemoveAssignment } from '@/hooks/useAssignments';
import { usePatientPractice } from '@/hooks/usePractice';
import type { PracticeItem } from '@milobedini/shared-types';

import ContentContainer from '../ContentContainer';
import { LoadingIndicator } from '../LoadingScreen';
import { ThemedText } from '../ThemedText';
import type { ActionMenuItem } from '../ui/ActionMenu';
import ActionMenu from '../ui/ActionMenu';
import EmptyState from '../ui/EmptyState';

import PatientPracticeCard from './PatientPracticeCard';

type PatientPracticeViewProps = {
  patientId: string;
  patientName: string;
};

type Section = {
  title: string;
  data: PracticeItem[];
};

const PatientPracticeViewBase = ({ patientId, patientName }: PatientPracticeViewProps) => {
  const { data, isPending, isFetching, refetch } = usePatientPractice(patientId);
  const router = useRouter();
  const [menuItem, setMenuItem] = useState<PracticeItem | null>(null);
  const { mutate: removeAssignmentMutate } = useRemoveAssignment();

  const sections: Section[] = [
    { title: 'Today', data: data?.today ?? [] },
    { title: 'This Week', data: data?.thisWeek ?? [] },
    { title: 'Upcoming', data: data?.upcoming ?? [] },
    { title: 'Recently Completed', data: data?.recentlyCompleted ?? [] }
  ].filter((section) => section.data.length > 0);

  const handleLongPress = useCallback((item: PracticeItem) => {
    setMenuItem(item);
  }, []);

  const handleEdit = useCallback(() => {
    if (!menuItem) return;
    router.push({
      pathname: '/(main)/(tabs)/patients/edit',
      params: {
        assignmentId: menuItem.assignmentId,
        patientName,
        moduleTitle: menuItem.moduleTitle,
        programTitle: menuItem.programTitle,
        moduleType: menuItem.moduleType,
        ...(menuItem.dueAt ? { dueAt: menuItem.dueAt } : {}),
        ...(menuItem.recurrence ? { recurrence: JSON.stringify(menuItem.recurrence) } : {}),
        ...(menuItem.notes ? { notes: menuItem.notes } : {}),
        headerTitle: 'Edit Assignment'
      }
    });
  }, [menuItem, patientName, router]);

  const handleRemove = useCallback(() => {
    if (!menuItem) return;
    removeAssignmentMutate({ assignmentId: menuItem.assignmentId });
  }, [menuItem, removeAssignmentMutate]);

  const menuActions: ActionMenuItem[] = menuItem
    ? [
        { icon: 'pencil-outline', label: 'Edit assignment', onPress: handleEdit },
        {
          icon: 'delete-outline',
          label: 'Remove assignment',
          onPress: handleRemove,
          variant: 'destructive',
          confirmTitle: 'Remove assignment?',
          confirmDescription: `This will permanently remove the ${menuItem.moduleTitle} assignment. Any in-progress work will be lost.`,
          confirmLabel: 'Remove'
        }
      ]
    : [];

  const renderItem = useCallback(
    ({ item }: SectionListRenderItemInfo<PracticeItem>) => (
      <PatientPracticeCard
        item={item}
        sparkline={data?.sparklines?.[item.moduleId]}
        patientId={patientId}
        patientName={patientName}
        onLongPress={handleLongPress}
      />
    ),
    [data?.sparklines, patientId, patientName, handleLongPress]
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionListData<PracticeItem, Section> }) => (
      <View className="pb-2 pt-4">
        <ThemedText
          type="smallBold"
          style={{
            textTransform: 'uppercase',
            letterSpacing: 1,
            color: section.title === 'Today' ? Colors.sway.bright : Colors.sway.darkGrey
          }}
        >
          {section.title}
        </ThemedText>
      </View>
    ),
    []
  );

  const renderItemSeparator = useCallback(() => <View className="h-2" />, []);

  const keyExtractor = useCallback((item: PracticeItem) => item.assignmentId, []);

  const listHeader = (
    <View className="pb-2 pt-2">
      <ThemedText type="subtitle">{patientName}</ThemedText>
    </View>
  );

  if (isPending) return <LoadingIndicator marginBottom={0} />;

  const isEmpty = !isFetching && sections.length === 0;

  return (
    <>
      <ContentContainer padded={false}>
        {isEmpty ? (
          <View className="flex-1 px-4">
            {listHeader}
            <EmptyState
              icon="clipboard-text-outline"
              title="No practice items"
              subtitle="This patient has no active or recent practice items."
            />
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            ItemSeparatorComponent={renderItemSeparator}
            ListHeaderComponent={listHeader}
            stickySectionHeadersEnabled={false}
            contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 16 }}
            refreshControl={
              <RefreshControl
                refreshing={isFetching && !isPending}
                onRefresh={refetch}
                tintColor={Colors.sway.bright}
              />
            }
          />
        )}
      </ContentContainer>
      <ActionMenu
        visible={!!menuItem}
        onDismiss={() => setMenuItem(null)}
        title={menuItem?.moduleTitle}
        subtitle={[menuItem?.dueAt ? `Due ${new Date(menuItem.dueAt).toLocaleDateString()}` : 'No due date']
          .filter(Boolean)
          .join(' · ')}
        actions={menuActions}
      />
    </>
  );
};

const PatientPracticeView = memo(PatientPracticeViewBase);

export default PatientPracticeView;
