import { useCallback, useRef, useState } from 'react';
import { FlatList, TouchableOpacity } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';
import { clsx } from 'clsx';
import { useFocusEffect, useRouter } from 'expo-router';
import { View } from 'moti';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useGetMyAttempts } from '@/hooks/useAttempts';
import { AttemptStatusInput } from '@/types/types';

import ErrorComponent, { ErrorTypes } from '../ErrorComponent';
import { LoadingIndicator } from '../LoadingScreen';
import { ThemedText } from '../ThemedText';
import { DateChip } from '../ui/Chip';

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

  const { data, isPending, isError } = useGetMyAttempts({ status: view });
  const attempts = data?.attempts;

  if (isPending) return <LoadingIndicator marginBottom={0} />;
  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;

  if (!data) return <ErrorComponent errorType={ErrorTypes.NO_CONTENT} />;

  const handleAttemptPress = (id: string, title: string) => {
    pushedChild.current = true;
    router.push({ pathname: '/attempts/[id]', params: { id, headerTitle: title } });
  };

  return (
    <View className="flex-1">
      <View className="mb-4">
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
        <View>
          <ThemedText>No {view} attempts</ThemedText>
        </View>
      ) : (
        <FlatList
          data={attempts}
          keyExtractor={(item) => item._id}
          renderItem={({ item, index }) => {
            const bgColor = index % 2 === 0 ? '' : 'bg-sway-buttonBackground';
            return (
              <TouchableOpacity
                key={item._id}
                className={clsx('gap-1 p-4', bgColor)}
                onPress={() => handleAttemptPress(item._id, item.module.title)}
              >
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
          }}
        />
      )}
    </View>
  );
};

export default PatientAttempts;
