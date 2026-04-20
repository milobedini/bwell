import { Pressable, TextInput, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import type { PreviousRating } from '@milobedini/shared-types';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

import RatingTrack from './RatingTrack';

// ── Accent colours per goal position ──
const GOAL_ACCENTS = [Colors.sway.bright, Colors.diary.enjoyment, Colors.diary.moodCool] as const;

// Faded accent backgrounds for goal number badges (12% opacity)
const ACCENT_FADED: Record<string, string> = {
  [Colors.sway.bright]: 'rgba(24,205,186,0.12)',
  [Colors.diary.enjoyment]: 'rgba(167,139,250,0.12)',
  [Colors.diary.moodCool]: 'rgba(91,141,239,0.12)'
};

type GoalCardProps = {
  index: number;
  goalText: string;
  rating: number | null;
  isReRating: boolean;
  canEdit: boolean;
  previousRatings: PreviousRating[];
  currentDate?: string;
  onGoalTextChange?: (text: string) => void;
  onRatingChange?: (rating: number) => void;
  onRemove?: () => void;
};

// ── Single row in the ratings timeline ──
const RatingRow = ({
  label,
  value,
  accent,
  isCurrent
}: {
  label: string;
  value: number | null | undefined;
  accent: string;
  isCurrent?: boolean;
}) => {
  const progress = value != null ? value / 10 : 0;
  const barOpacity = isCurrent ? 1 : 0.45;

  return (
    <View className="flex-row items-center gap-2">
      <ThemedText
        type={isCurrent ? 'smallBold' : 'small'}
        style={{ color: isCurrent ? accent : Colors.sway.darkGrey, width: 84 }}
        numberOfLines={1}
      >
        {label}
      </ThemedText>

      <View className="flex-1">
        <View className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: Colors.chip.darkCardAlt }}>
          {value != null && (
            <View
              className="h-full rounded-full"
              style={{ width: `${progress * 100}%`, backgroundColor: accent, opacity: barOpacity }}
            />
          )}
        </View>
      </View>

      <ThemedText
        type="smallBold"
        style={{ color: isCurrent ? accent : Colors.sway.darkGrey, width: 24, textAlign: 'right' }}
      >
        {value ?? '—'}
      </ThemedText>
    </View>
  );
};

// ── Previous ratings timeline (edit mode only) ──
const PreviousRatingsTimeline = ({
  entries,
  goalIndex,
  accent
}: {
  entries: PreviousRating[];
  goalIndex: number;
  accent: string;
}) => {
  if (entries.length === 0) return null;

  return (
    <View className="mt-3 gap-2">
      <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
        Previous ratings
      </ThemedText>
      {entries.map((entry, i) => (
        <RatingRow
          key={entry.date}
          label={`#${i + 1} \u00B7 ${new Date(entry.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
          value={entry.ratings[goalIndex]}
          accent={accent}
        />
      ))}
    </View>
  );
};

const formatDate = (date: string) => new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

// ── Full ratings history (view mode: previous + current in one timeline) ──
const RatingsHistory = ({
  entries,
  currentRating,
  currentDate,
  goalIndex,
  accent
}: {
  entries: PreviousRating[];
  currentRating: number | null;
  currentDate: string;
  goalIndex: number;
  accent: string;
}) => {
  const lastPrevious = entries.length > 0 ? entries[entries.length - 1].ratings[goalIndex] : null;
  const trend: 'up' | 'down' | 'same' | null =
    currentRating != null && lastPrevious != null
      ? currentRating > lastPrevious
        ? 'up'
        : currentRating < lastPrevious
          ? 'down'
          : 'same'
      : null;

  const trendIcon = trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : null;
  const trendColour = trend === 'up' ? Colors.primary.success : trend === 'down' ? Colors.primary.error : undefined;

  return (
    <View className="mt-3 gap-2">
      <View className="flex-row items-center gap-2">
        <ThemedText type="smallBold" style={{ color: Colors.sway.darkGrey }}>
          Rating history
        </ThemedText>
        {trendIcon && trendColour && <MaterialCommunityIcons name={trendIcon} size={16} color={trendColour} />}
      </View>
      {entries.map((entry, i) => (
        <RatingRow
          key={entry.date}
          label={`#${i + 1} \u00B7 ${formatDate(entry.date)}`}
          value={entry.ratings[goalIndex]}
          accent={accent}
        />
      ))}
      <RatingRow
        label={`#${entries.length + 1} \u00B7 ${formatDate(currentDate)}`}
        value={currentRating}
        accent={accent}
        isCurrent
      />
    </View>
  );
};

const GoalCard = ({
  index,
  goalText,
  rating,
  isReRating,
  canEdit,
  previousRatings,
  currentDate,
  onGoalTextChange,
  onRatingChange,
  onRemove
}: GoalCardProps) => {
  const accent = GOAL_ACCENTS[index] ?? Colors.sway.bright;
  const showRemove = canEdit && !isReRating && onRemove;

  return (
    <View
      className="mb-4 overflow-hidden rounded-xl"
      style={{
        backgroundColor: Colors.chip.darkCard,
        borderLeftWidth: 3,
        borderLeftColor: accent
      }}
    >
      <View className="p-4">
        <View className="mb-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View
              className="h-6 w-6 items-center justify-center rounded-md"
              style={{ backgroundColor: ACCENT_FADED[accent] ?? Colors.tintSubtle.teal }}
            >
              <ThemedText type="smallBold" style={{ color: accent, fontSize: 12 }}>
                {index + 1}
              </ThemedText>
            </View>
            <ThemedText type="smallBold" style={{ color: accent }}>
              Goal {index + 1}
            </ThemedText>
          </View>

          {showRemove && (
            <Pressable
              onPress={onRemove}
              className="flex-row items-center gap-1 active:opacity-60"
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Remove goal ${index + 1}`}
            >
              <MaterialCommunityIcons name="close-circle-outline" size={16} color={Colors.primary.error} />
              <ThemedText type="small" style={{ color: Colors.primary.error }}>
                Remove
              </ThemedText>
            </Pressable>
          )}
        </View>

        {canEdit && !isReRating ? (
          <TextInput
            value={goalText}
            onChangeText={onGoalTextChange}
            placeholder="What would you like to achieve?"
            placeholderTextColor={Colors.sway.darkGrey}
            multiline
            submitBehavior="blurAndSubmit"
            returnKeyType="done"
            style={{
              backgroundColor: Colors.chip.darkCardDeep,
              color: Colors.sway.lightGrey,
              borderRadius: 10,
              padding: 14,
              marginBottom: 14,
              minHeight: 64,
              fontSize: 16,
              fontFamily: 'Lato-Regular'
            }}
          />
        ) : (
          <View className="mb-3 rounded-lg p-3" style={{ backgroundColor: Colors.chip.darkCardDeep }}>
            <ThemedText>{goalText || '—'}</ThemedText>
          </View>
        )}

        {canEdit && isReRating && (
          <PreviousRatingsTimeline entries={previousRatings} goalIndex={index} accent={accent} />
        )}

        {canEdit ? (
          <RatingTrack
            selected={rating}
            onSelect={onRatingChange}
            label={isReRating ? 'New rating' : 'How close are you to this goal?'}
            style={isReRating ? { marginTop: 12 } : undefined}
          />
        ) : isReRating ? (
          <RatingsHistory
            entries={previousRatings}
            currentRating={rating}
            currentDate={currentDate ?? new Date().toISOString()}
            goalIndex={index}
            accent={accent}
          />
        ) : (
          <RatingRow label="Rating" value={rating} accent={accent} isCurrent />
        )}
      </View>
    </View>
  );
};

export default GoalCard;
