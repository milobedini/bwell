import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import type { AttentionPriority, AttentionReason, ReviewItem } from '@milobedini/shared-types';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

import { ThemedText } from '../ThemedText';

const REASON_LABELS: Record<AttentionReason, string> = {
  severe_score: 'Severe score',
  score_regression: 'Score worsening',
  overdue: 'Overdue',
  first_submission: 'First submission'
};

const PRIORITY_COLORS: Record<AttentionPriority, string> = {
  high: Colors.primary.error,
  medium: Colors.primary.warning,
  low: Colors.primary.info
};

type AttentionItemProps = { item: ReviewItem };

const AttentionItemBase = ({ item }: AttentionItemProps) => {
  const priorityColor = item.attentionPriority ? PRIORITY_COLORS[item.attentionPriority] : Colors.sway.darkGrey;
  const reasonLabel = item.attentionReason ? REASON_LABELS[item.attentionReason] : undefined;
  const attemptId = item.latestAttempt?.attemptId;

  const handlePress = () => {
    if (attemptId) {
      router.push({ pathname: '/review/[id]', params: { id: attemptId, headerTitle: item.patientName } });
    }
  };

  return (
    <Pressable onPress={handlePress} className="mb-2 overflow-hidden rounded-xl bg-chip-darkCard active:opacity-80">
      <View className="flex-row">
        {/* Priority accent border */}
        <View className="w-1 rounded-l-xl" style={{ backgroundColor: priorityColor }} />

        <View className="flex-1 flex-row items-center justify-between p-3">
          <View className="flex-1 gap-0.5">
            <ThemedText type="smallBold">{item.patientName}</ThemedText>
            <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
              {item.moduleTitle}
              {item.latestAttempt?.totalScore != null ? ` · ${item.latestAttempt.totalScore}` : ''}
            </ThemedText>
          </View>

          {!!reasonLabel && (
            <ThemedText type="small" style={{ color: priorityColor, flexShrink: 0, marginLeft: 8 }}>
              {reasonLabel}
            </ThemedText>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const AttentionItem = memo(AttentionItemBase);

type Props = { items: ReviewItem[] };

const NeedsAttentionSectionBase = ({ items }: Props) => {
  if (items.length === 0) return null;

  return (
    <View className="mb-4">
      {/* Section header */}
      <View className="mb-2 flex-row items-center gap-1.5">
        <MaterialCommunityIcons name="alert-circle" size={18} color={Colors.primary.error} />
        <ThemedText
          type="smallBold"
          style={{ color: Colors.primary.error, textTransform: 'uppercase', fontSize: 12, letterSpacing: 0.8 }}
        >
          Needs Attention ({items.length})
        </ThemedText>
      </View>

      {items.map((item) => (
        <AttentionItem key={item.assignmentId || item.latestAttempt?.attemptId || item.moduleId} item={item} />
      ))}
    </View>
  );
};

const NeedsAttentionSection = memo(NeedsAttentionSectionBase);

export default NeedsAttentionSection;
