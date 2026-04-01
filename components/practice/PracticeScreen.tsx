import { memo, useCallback } from 'react';
import { RefreshControl, SectionList, type SectionListData, type SectionListRenderItemInfo, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useMyPractice } from '@/hooks/usePractice';
import type { PracticeItem as PracticeItemType } from '@milobedini/shared-types';

import ContentContainer from '../ContentContainer';
import { LoadingIndicator } from '../LoadingScreen';
import { ThemedText } from '../ThemedText';
import EmptyState from '../ui/EmptyState';

import PracticeItem from './PracticeItem';

type Section = {
  title: string;
  data: PracticeItemType[];
};

const PracticeScreen = () => {
  const { data, isPending, isFetching, refetch } = useMyPractice();

  const sections: Section[] = [
    { title: 'Today', data: data?.today ?? [] },
    { title: 'This Week', data: data?.thisWeek ?? [] },
    { title: 'Upcoming', data: data?.upcoming ?? [] },
    { title: 'Recently Completed', data: data?.recentlyCompleted ?? [] }
  ].filter((section) => section.data.length > 0);

  const renderItem = useCallback(
    ({ item }: SectionListRenderItemInfo<PracticeItemType>) => <PracticeItem item={item} />,
    []
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionListData<PracticeItemType, Section> }) => (
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

  const renderItemSeparator = useCallback(() => <View className="h-3" />, []);

  const keyExtractor = useCallback((item: PracticeItemType) => item.assignmentId, []);

  if (isPending) return <LoadingIndicator marginBottom={0} />;

  const isEmpty = !isFetching && sections.length === 0;

  return (
    <ContentContainer padded={false}>
      {isEmpty ? (
        <EmptyState
          icon="clipboard-text-outline"
          title="All caught up"
          subtitle="You have no practice items right now. Check back when your therapist assigns new tasks."
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          ItemSeparatorComponent={renderItemSeparator}
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

export default memo(PracticeScreen);
