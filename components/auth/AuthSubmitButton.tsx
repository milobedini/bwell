import { Pressable, Text, View } from 'react-native';
import { Colors } from '@/constants/Colors';

type AuthSubmitButtonProps = {
  label: string;
  loadingLabel: string;
  isPending: boolean;
  disabled: boolean;
  onPress: () => void;
  testID?: string;
};

const AuthSubmitButton = ({ label, loadingLabel, isPending, disabled, onPress, testID }: AuthSubmitButtonProps) => (
  <Pressable style={{ marginBottom: 16 }} onPress={onPress} disabled={disabled} testID={testID}>
    <View
      style={{
        backgroundColor: disabled ? Colors.sway.darkGrey : Colors.sway.dark,
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Text
        style={{
          fontWeight: '700',
          fontSize: 16,
          color: disabled ? Colors.sway.white : Colors.sway.bright
        }}
      >
        {isPending ? loadingLabel : label}
      </Text>
    </View>
  </Pressable>
);

export default AuthSubmitButton;
