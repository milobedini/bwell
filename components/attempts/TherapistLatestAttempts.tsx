import { type ComponentProps, memo, useCallback } from 'react';
import { FlatList, type ListRenderItemInfo, Pressable, View } from 'react-native';
import { Link } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useTherapistGetLatestAttempts } from '@/hooks/useAttempts';
import { dateString, timeAgo } from '@/utils/dates';
import { getSeverityColors } from '@/utils/severity';
import type { TherapistLatestRow } from '@milobedini/shared-types';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

import ContentContainer from '../ContentContainer';
import ErrorComponent, { ErrorTypes } from '../ErrorComponent';
import { LoadingIndicator } from '../LoadingScreen';
import { ThemedText } from '../ThemedText';
import EmptyState from '../ui/EmptyState';

type MCIName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const MODULE_TYPE_ICONS: Record<string, MCIName> = {
  questionnaire: 'clipboard-text-outline',
  activity_diary: 'calendar-week',
  psychoeducation: 'book-open-outline',
  exercise: 'pencil-outline'
};

const getModuleIcon = (moduleType?: string): MCIName =>
  (moduleType && MODULE_TYPE_ICONS[moduleType]) || 'file-document-outline';

const ItemSeparator = () => <View className="h-3" />;

const TherapistAttemptListItemBase = ({ item }: { item: TherapistLatestRow }) => {
  const severity = getSeverityColors(item.scoreBandLabel);
  const { relative, formatted } = timeAgo(item.completedAt || '');
  const icon = getModuleIcon(item.moduleType);

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
    >
      <Pressable
        className="overflow-hidden rounded-xl bg-chip-darkCard"
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
      >
        <View className="flex-row">
          {/* Severity accent border */}
          <View className="w-1 rounded-l-xl" style={{ backgroundColor: severity.border }} />

          <View className="flex-1 gap-2 p-4">
            {/* Row 1: Icon + Title + Iteration */}
            <View className="flex-row items-center gap-2">
              <MaterialCommunityIcons name={icon} size={18} color={Colors.sway.darkGrey} />
              <ThemedText type="smallTitle" className="flex-1 flex-shrink" numberOfLines={1}>
                {item.module.title}
              </ThemedText>
              {!!item.iteration && item.iteration > 1 && (
                <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: Colors.tint.teal }}>
                  <ThemedText type="small" style={{ color: Colors.sway.bright, fontSize: 12 }}>
                    #{item.iteration}
                  </ThemedText>
                </View>
              )}
            </View>

            {/* Row 2: Patient name */}
            <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
              {item.user.name}
            </ThemedText>

            {/* Row 3: Score pill + band label (questionnaires only) */}
            {!!item.totalScore && (
              <View className="flex-row items-center gap-2">
                <View className="rounded-lg px-3 py-1" style={{ backgroundColor: severity.pillBg }}>
                  <ThemedText type="smallBold" style={{ color: severity.border }}>
                    {item.totalScore}
                  </ThemedText>
                </View>
                <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
                  {item.scoreBandLabel}
                </ThemedText>
              </View>
            )}

            {/* Row 4: Relative time + date */}
            <View className="flex-row items-center gap-1">
              <MaterialCommunityIcons name="calendar" size={14} color={Colors.sway.darkGrey} />
              <ThemedText type="small" style={{ color: Colors.sway.darkGrey, fontSize: 12 }}>
                {relative ? `${relative} · ${formatted}` : formatted}
              </ThemedText>
            </View>
          </View>
        </View>
      </Pressable>
    </Link>
  );
};

const TherapistAttemptListItem = memo(TherapistAttemptListItemBase);

const TherapistLatestAttempts = () => {
  const { data, isPending, isError } = useTherapistGetLatestAttempts();

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<TherapistLatestRow>) => <TherapistAttemptListItem item={item} />,
    []
  );

  if (isPending) return <LoadingIndicator marginBottom={0} />;
  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;
  if (!data) return <ErrorComponent errorType={ErrorTypes.NO_CONTENT} />;

  return (
    <ContentContainer padded={false}>
      {data.length ? (
        <FlatList
          data={data}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          ItemSeparatorComponent={ItemSeparator}
          contentContainerStyle={{ padding: 16 }}
        />
      ) : (
        <EmptyState
          icon="clipboard-text-outline"
          title="No submissions yet"
          subtitle="Completed work from your patients will appear here"
        />
      )}
    </ContentContainer>
  );
};

export default TherapistLatestAttempts;
