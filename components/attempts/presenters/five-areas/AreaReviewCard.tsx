import { View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';

import { AREA_LABELS, type AreaKey } from './useFiveAreasState';

type AreaReviewCardProps = {
  areaKey: AreaKey;
  value: string;
};

const AreaReviewCard = ({ areaKey, value }: AreaReviewCardProps) => {
  const isReflection = areaKey === 'reflection';

  return (
    <View
      className="mb-3 rounded-xl p-4"
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
    </View>
  );
};

export default AreaReviewCard;
