import { memo, useCallback, useRef, useState } from 'react';
import { FlatList, type ListRenderItemInfo, TouchableOpacity } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';
import { clsx } from 'clsx';
import { useFocusEffect, useRouter } from 'expo-router';
import { View } from 'moti';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useGetMyAttempts } from '@/hooks/useAttempts';
import { usePrefetchMyAttemptDetail } from '@/hooks/usePrefetch';
import { AttemptStatusInput } from '@/types/types';
import type { AttemptListItem } from '@milobedini/shared-types';

import ErrorComponent, { ErrorTypes } from '../ErrorComponent';
import { LoadingIndicator } from '../LoadingScreen';
import { ThemedText } from '../ThemedText';
import { DateChip } from '../ui/Chip';
import EmptyState from '../ui/EmptyState';

type AttemptListItemProps = {
  item: AttemptListItem;
  index: number;
  onPress: (id: string, title: string) => void;
};

const AttemptListItemBase = ({ item, index, onPress }: AttemptListItemProps) => {
  const bgColor = index % 2 === 0 ? '' : 'bg-sway-buttonBackground';
  return (
    <TouchableOpacity className={clsx('gap-1 p-4', bgColor)} onPress={() => onPress(item._id, item.module.title)}>
      <ThemedText type="smallTitle">{item.module.title}</ThemedText>
      {!!item.totalScore && (
        <ThemedText>
          {item.totalScore} {item.scoreBandLabel}
        </ThemedText>
      )}
      <View className="flex-row items-center gap-4">
        <DateChip prefix={item.status} dateString={item.completedAt || item.lastInteractionAt || ''} />
      </View>
    </TouchableOpacity>
  );
};

const AttemptListItemMemo = memo(AttemptListItemBase);

const PatientAttempts = () => {
  const router = useRouter();
  const [view, setView] = useState<AttemptStatusInput>(AttemptStatusInput.ACTIVE);
  const pushedChild = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (pushedChild.current) {
        pushedChild.current = false;
        return;
      }
      setView(AttemptStatusInput.ACTIVE);
    }, [])
  );

  const prefetchDetail = usePrefetchMyAttemptDetail();
  const { data, isPending, isError } = useGetMyAttempts({ status: view });
  const attempts = data?.attempts;

  const handleAttemptPress = useCallback(
    (id: string, title: string) => {
      prefetchDetail(id);
      pushedChild.current = true;
      router.push({ pathname: '/attempts/[id]', params: { id, headerTitle: title } });
    },
    [router, prefetchDetail]
  );

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<AttemptListItem>) => (
      <AttemptListItemMemo item={item} index={index} onPress={handleAttemptPress} />
    ),
    [handleAttemptPress]
  );

  if (isPending) return <LoadingIndicator marginBottom={0} />;
  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;

  if (!data) return <ErrorComponent errorType={ErrorTypes.NO_CONTENT} />;

  return (
    <View className="flex-1">
      <View className="mb-4 px-4">
        <SegmentedButtons
          value={view}
          onValueChange={(v) => setView(v as AttemptStatusInput)}
          buttons={[
            {
              value: AttemptStatusInput.ACTIVE,
              label: 'Active',
              checkedColor: Colors.sway.bright,
              uncheckedColor: 'white',
              style: { backgroundColor: Colors.sway.buttonBackground },
              labelStyle: {
                fontFamily: Fonts.Bold,
                fontSize: 18
              }
            },
            {
              value: AttemptStatusInput.COMPLETED,
              label: 'Completed',
              checkedColor: Colors.sway.bright,
              uncheckedColor: 'white',
              style: { backgroundColor: Colors.sway.buttonBackground },
              labelStyle: {
                fontFamily: Fonts.Bold,
                fontSize: 18
              }
            }
          ]}
        />
      </View>
      {!attempts?.length ? (
        <EmptyState icon="file-document-outline" title={`No ${view} attempts`} />
      ) : (
        <FlatList data={attempts} keyExtractor={(item) => item._id} renderItem={renderItem} />
      )}
    </View>
  );
};

export default PatientAttempts;
