import { Pressable, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import MaterialIcons from '@react-native-vector-icons/material-icons';

type AuthSheetHandleProps = {
  onPress: () => void;
};

const AuthSheetHandle = ({ onPress }: AuthSheetHandleProps) => (
  <Pressable onPress={onPress}>
    <View
      style={{
        height: 64,
        borderBottomWidth: 1,
        borderBottomColor: Colors.sway.bright,
        backgroundColor: Colors.sway.dark,
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <MaterialIcons
        name="keyboard-arrow-down"
        size={36}
        color={Colors.sway.bright}
        style={{ transform: [{ scaleX: 1.4 }, { scaleY: 1.4 }] }}
      />
    </View>
  </Pressable>
);

export default AuthSheetHandle;
