import { Pressable, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';

import { AREA_LABELS, type AreaKey } from './useFiveAreasState';

type AreaReviewCardProps = {
  areaKey: AreaKey;
  value: string;
  onPress?: () => void;
};

const AreaReviewCard = ({ areaKey, value, onPress }: AreaReviewCardProps) => {
  const isReflection = areaKey === 'reflection';
  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper
      {...(onPress ? { onPress } : {})}
      className="mb-3 rounded-xl p-4 active:opacity-70"
      style={{
        backgroundColor: Colors.chip.darkCard,
        borderLeftWidth: 3,
        borderLeftColor: isReflection ? Colors.primary.info : Colors.sway.bright
      }}
    >
      <ThemedText
        type="smallBold"
        style={{
          color: isReflection ? Colors.primary.info : Colors.sway.bright,
          marginBottom: 6
        }}
      >
        {AREA_LABELS[areaKey]}
      </ThemedText>
      <ThemedText style={{ color: Colors.sway.lightGrey }}>{value || '—'}</ThemedText>
    </Wrapper>
  );
};

export default AreaReviewCard;
