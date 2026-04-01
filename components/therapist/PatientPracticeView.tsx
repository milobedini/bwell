import { memo, useCallback } from 'react';
import { RefreshControl, SectionList, type SectionListData, type SectionListRenderItemInfo, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { usePatientPractice } from '@/hooks/usePractice';
import type { PracticeItem } from '@milobedini/shared-types';

import ContentContainer from '../ContentContainer';
import { LoadingIndicator } from '../LoadingScreen';
import { ThemedText } from '../ThemedText';
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

  const sections: Section[] = [
    { title: 'Today', data: data?.today ?? [] },
    { title: 'This Week', data: data?.thisWeek ?? [] },
    { title: 'Upcoming', data: data?.upcoming ?? [] },
    { title: 'Recently Completed', data: data?.recentlyCompleted ?? [] }
  ].filter((section) => section.data.length > 0);

  const renderItem = useCallback(
    ({ item }: SectionListRenderItemInfo<PracticeItem>) => (
      <PatientPracticeCard
        item={item}
        sparkline={data?.sparklines?.[item.moduleId]}
        patientId={patientId}
        patientName={patientName}
      />
    ),
    [data?.sparklines, patientId, patientName]
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
            <RefreshControl refreshing={isFetching && !isPending} onRefresh={refetch} tintColor={Colors.sway.bright} />
          }
        />
      )}
    </ContentContainer>
  );
};

const PatientPracticeView = memo(PatientPracticeViewBase);

export default PatientPracticeView;
