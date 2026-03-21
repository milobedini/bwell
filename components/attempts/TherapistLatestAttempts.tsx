import { useCallback } from 'react';
import { FlatList, type ListRenderItemInfo, TouchableOpacity, View } from 'react-native';
import { clsx } from 'clsx';
import { Link } from 'expo-router';
import { useTherapistGetLatestAttempts } from '@/hooks/useAttempts';
import { dateString } from '@/utils/dates';
import type { TherapistLatestRow } from '@milobedini/shared-types';

import ContentContainer from '../ContentContainer';
import ErrorComponent, { ErrorTypes } from '../ErrorComponent';
import { LoadingIndicator } from '../LoadingScreen';
import { ThemedText } from '../ThemedText';
import { DateChip } from '../ui/Chip';
import EmptyState from '../ui/EmptyState';

const TherapistLatestAttempts = () => {
  const { data, isPending, isError } = useTherapistGetLatestAttempts();

  const renderItem = useCallback(({ item, index }: ListRenderItemInfo<TherapistLatestRow>) => {
    const bgColor = index % 2 === 0 ? '' : 'bg-sway-buttonBackground';

    return (
      <Link
        asChild
        href={{
          pathname: '/attempts/[id]',
          params: {
            id: item._id,
            headerTitle: `${item.module.title} (${dateString(item.completedAt || '')})`
          }
        }}
        push
        withAnchor
      >
        <TouchableOpacity key={item._id} className={clsx('gap-2 p-4', bgColor)}>
          <ThemedText type="subtitle">
            {item.module.title} by {item.user.name}
          </ThemedText>
          {!!item.totalScore && (
            <ThemedText>
              {item.totalScore} {item.scoreBandLabel}
            </ThemedText>
          )}
          <View className="flex-row items-center gap-4">
            <DateChip prefix={'Completed'} dateString={item.completedAt || ''} />
          </View>
        </TouchableOpacity>
      </Link>
    );
  }, []);

  if (isPending) return <LoadingIndicator marginBottom={0} />;
  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;

  if (!data) return <ErrorComponent errorType={ErrorTypes.NO_CONTENT} />;

  return (
    <ContentContainer padded={false}>
      {data.length ? (
        <FlatList data={data} keyExtractor={(item) => item._id} renderItem={renderItem} />
      ) : (
        <EmptyState icon="file-document-outline" title="No submissions" />
      )}
    </ContentContainer>
  );
};

export default TherapistLatestAttempts;
