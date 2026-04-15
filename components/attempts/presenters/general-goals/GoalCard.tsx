import { Pressable, TextInput, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import type { PreviousRating } from '@milobedini/shared-types';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

import RatingTrack from './RatingTrack';

// ── Accent colours per goal position ──
const GOAL_ACCENTS = [Colors.sway.bright, Colors.diary.enjoyment, Colors.diary.moodCool] as const;

type GoalCardProps = {
  index: number;
  goalText: string;
  rating: number | null;
  isReRating: boolean;
  canEdit: boolean;
  previousRatings: PreviousRating[];
  onGoalTextChange?: (text: string) => void;
  onRatingChange?: (rating: number) => void;
  onRemove?: () => void;
  onInputFocus?: () => void;
};

// ── Previous ratings timeline ──
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
      {entries.map((entry) => {
        const value = entry.ratings[goalIndex];
        const progress = value != null ? value / 10 : 0;

        return (
          <View key={entry.date} className="flex-row items-center gap-3">
            <ThemedText type="small" style={{ color: Colors.sway.darkGrey, width: 52 }}>
              {new Date(entry.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </ThemedText>

            {/* Mini progress bar */}
            <View className="flex-1">
              <View className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: Colors.chip.darkCardAlt }}>
                {value != null && (
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${progress * 100}%`,
                      backgroundColor: accent,
                      opacity: 0.6
                    }}
                  />
                )}
              </View>
            </View>

            <ThemedText type="smallBold" style={{ color: accent, width: 28, textAlign: 'right' }}>
              {value ?? '—'}
            </ThemedText>
          </View>
        );
      })}
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
  onGoalTextChange,
  onRatingChange,
  onRemove,
  onInputFocus
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
        {/* Header row */}
        <View className="mb-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View className="h-6 w-6 items-center justify-center rounded-md" style={{ backgroundColor: `${accent}20` }}>
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

        {/* Goal text */}
        {canEdit && !isReRating ? (
          <TextInput
            value={goalText}
            onChangeText={onGoalTextChange}
            onFocus={onInputFocus}
            placeholder="What would you like to achieve?"
            placeholderTextColor={Colors.sway.darkGrey}
            multiline
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

        {/* Previous ratings timeline (re-rating mode) */}
        {isReRating && <PreviousRatingsTimeline entries={previousRatings} goalIndex={index} accent={accent} />}

        {/* Rating input or display */}
        {canEdit ? (
          <View style={{ marginTop: isReRating ? 12 : 0 }}>
            <RatingTrack
              selected={rating}
              onSelect={onRatingChange}
              label={isReRating ? 'New rating' : 'How close are you to this goal?'}
            />
          </View>
        ) : (
          <View className="mt-1 flex-row items-center gap-3">
            <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
              Rating
            </ThemedText>
            <View className="flex-row items-center gap-2">
              <View
                className="h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: accent, opacity: 0.9 }}
              >
                <ThemedText type="smallBold" style={{ color: Colors.sway.dark }}>
                  {rating !== null && rating !== undefined ? String(rating) : '—'}
                </ThemedText>
              </View>
              <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
                /10
              </ThemedText>
            </View>

            {/* View-mode progress bar */}
            {rating !== null && rating !== undefined && (
              <View className="flex-1">
                <View
                  className="h-1.5 overflow-hidden rounded-full"
                  style={{ backgroundColor: Colors.chip.darkCardAlt }}
                >
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${(rating / 10) * 100}%`,
                      backgroundColor: accent
                    }}
                  />
                </View>
              </View>
            )}
          </View>
        )}

        {/* View-mode previous ratings */}
        {!canEdit && isReRating && (
          <PreviousRatingsTimeline entries={previousRatings} goalIndex={index} accent={accent} />
        )}
      </View>
    </View>
  );
};

export default GoalCard;
