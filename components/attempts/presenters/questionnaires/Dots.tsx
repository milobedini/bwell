import { View } from 'react-native';
import { Colors } from '@/constants/Colors';

const Dots = ({ total, index }: { total: number; index: number }) => {
  if (total <= 1) return null;
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 8 }}>
      {Array.from({ length: total }).map((_, i) => {
        const active = i === index;
        return (
          <View
            key={i}
            style={{
              width: active ? 12 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: active ? Colors.sway.bright : '#3A496B'
            }}
          />
        );
      })}
    </View>
  );
};

export default Dots;
