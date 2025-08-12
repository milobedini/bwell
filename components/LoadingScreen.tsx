import { View } from 'react-native';
import LottieView from 'lottie-react-native';
import { Colors } from '@/constants/Colors';

export const LoadingIndicator = ({
  marginBottom,
  transparent = false
}: {
  marginBottom: number;
  transparent?: boolean;
}) => {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: (!transparent && Colors.sway.dark) || 'inherit',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: marginBottom,
        width: '100%',
        margin: 0,
        padding: 0
      }}
    >
      <LottieView
        style={{ alignSelf: 'center', width: 260, height: 260 }}
        source={require('../assets/loading.json')}
        autoPlay
        loop
        speed={0.7}
      />
    </View>
  );
};
