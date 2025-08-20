import { useState } from 'react';
import { FlatList, TouchableOpacity } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';
import { clsx } from 'clsx';
import { Link } from 'expo-router';
import { View } from 'moti';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useGetMyAttempts } from '@/hooks/useAttempts';
import { AttemptStatusInput } from '@/types/types';

import Container from '../Container';
import ErrorComponent, { ErrorTypes } from '../ErrorComponent';
import { LoadingIndicator } from '../LoadingScreen';
import { ThemedText } from '../ThemedText';
import { DateChip } from '../ui/Chip';

const PatientAttempts = () => {
  const [view, setView] = useState<AttemptStatusInput>(AttemptStatusInput.ACTIVE);
  const { data, isPending, isError } = useGetMyAttempts({ status: view });
  const attempts = data?.attempts;

  if (isPending) return <LoadingIndicator marginBottom={0} />;
  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;

  if (!data) return <ErrorComponent errorType={ErrorTypes.NO_CONTENT} />;

  return (
    <Container>
      <View className="mb-4 px-8">
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
        <View className="px-8">
          <ThemedText>No {view} attempts</ThemedText>
        </View>
      ) : (
        <FlatList
          data={attempts}
          keyExtractor={(item) => item._id}
          renderItem={({ item, index }) => {
            const bgColor = index % 2 === 0 ? '' : 'bg-sway-buttonBackground';
            return (
              <Link
                asChild
                href={{
                  pathname: '/attempts/[id]',
                  params: {
                    id: item._id,
                    headerTitle: `${item.module.title} detail`
                  }
                }}
                push
              >
                <TouchableOpacity key={item._id} className={clsx('gap-1 p-4', bgColor)}>
                  <ThemedText type="smallTitle">{item.module.title}</ThemedText>
                  {item.totalScore && (
                    <ThemedText>
                      {item.totalScore} {item.scoreBandLabel}
                    </ThemedText>
                  )}
                  {/* Todo - it becomes started when you create it. Fine? */}
                  <View className="flex-row items-center gap-4">
                    <DateChip prefix={item.status} dateString={item.completedAt || item.lastInteractionAt || ''} />
                  </View>
                </TouchableOpacity>
              </Link>
            );
          }}
        ></FlatList>
      )}
    </Container>
  );
};

export default PatientAttempts;
