import { Chip } from 'react-native-paper';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const EnrolledChip = () => {
  return (
    <Chip
      icon={() => <MaterialCommunityIcons name="bookmark-check" size={24} color={Colors.primary.charcoal} />}
      mode="outlined"
      compact
      textStyle={{
        fontFamily: Fonts.Black,
        color: Colors.primary.charcoal
      }}
      style={{
        backgroundColor: Colors.primary.accent,
        borderColor: Colors.primary.rose
      }}
    >
      Enrolled
    </Chip>
  );
};

export { EnrolledChip };
