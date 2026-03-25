import { useCallback, useRef } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LoadingIndicator } from '@/components/LoadingScreen';
import { ThemedText } from '@/components/ThemedText';
import EmptyState from '@/components/ui/EmptyState';
import { Colors } from '@/constants/Colors';
import { useTherapistDashboard } from '@/hooks/useTherapistDashboard';
import { formatShortDate, getGreeting } from '@/utils/dates';

import StatStrip from './dashboard/StatStrip';
import TriageBucket, { BucketType } from './dashboard/TriageBucket';

type Props = {
  firstName: string;
};

const TherapistDashboard = ({ firstName }: Props) => {
  const router = useRouter();
  const { data, isPending, isError, refetch, isRefetching } = useTherapistDashboard();

  const scrollRef = useRef<ScrollView>(null);
  const attentionRef = useRef<View>(null);
  const completedRef = useRef<View>(null);
  const inactiveRef = useRef<View>(null);

  const handleScrollToBucket = useCallback((bucket: BucketType | 'top') => {
    const refMap = {
      attention: attentionRef,
      completed: completedRef,
      inactive: inactiveRef,
      top: null
    };
    const target = refMap[bucket];
    if (!target || !target.current) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    target.current.measureLayout(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      scrollRef.current as any,
      (_x: number, y: number) => {
        scrollRef.current?.scrollTo({ y, animated: true });
      },
      () => {}
    );
  }, []);

  if (isPending) return <LoadingIndicator marginBottom={0} />;

  if (isError || !data) {
    return <EmptyState icon="alert-circle-outline" title="Could not load dashboard" subtitle="Pull down to retry" />;
  }

  // Zero clients empty state
  if (data.stats.totalClients === 0) {
    return (
      <View className="flex-1 px-4">
        <View className="py-2">
          <ThemedText type="subtitle">
            {getGreeting()}, {firstName}
          </ThemedText>
        </View>
        <EmptyState
          icon="account-group-outline"
          title="No clients yet"
          subtitle="Browse patients to add your first client"
          action={{
            label: 'Browse patients',
            onPress: () => router.push('/home/patients')
          }}
        />
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      className="flex-1 px-4"
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.sway.bright} />}
    >
      {/* Greeting */}
      <View className="py-2">
        <ThemedText type="subtitle">
          {getGreeting()}, {firstName}
        </ThemedText>
        <ThemedText type="small" style={{ color: Colors.sway.darkGrey, marginTop: 2 }}>
          Week of {formatShortDate(data.weekStart)}
        </ThemedText>
      </View>

      {/* Stat pills */}
      <StatStrip stats={data.stats} onScrollToBucket={handleScrollToBucket} />

      {/* Zero assignments banner */}
      {data.stats.totalClients > 0 &&
        data.needsAttention.length === 0 &&
        data.completedThisWeek.length === 0 &&
        data.noActivity.every((c) => c.assignments.total === 0) && (
          <Pressable
            onPress={() => router.push('/home/clients')}
            className="mb-2 rounded-xl p-3.5"
            style={{ backgroundColor: Colors.tint.teal }}
          >
            <ThemedText type="smallBold" style={{ color: Colors.sway.bright }}>
              Assign homework to get started
            </ThemedText>
            <ThemedText type="small" style={{ color: Colors.sway.darkGrey, marginTop: 2 }}>
              Tap to view your clients and create assignments
            </ThemedText>
          </Pressable>
        )}

      {/* Triage buckets */}
      <TriageBucket ref={attentionRef} type="attention" items={data.needsAttention} />
      <TriageBucket ref={completedRef} type="completed" items={data.completedThisWeek} />
      <TriageBucket ref={inactiveRef} type="inactive" items={data.noActivity} />

      {/* Bottom spacing */}
      <View className="h-8" />
    </ScrollView>
  );
};

export default TherapistDashboard;
