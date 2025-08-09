import { View } from 'react-native';
import type { ToastConfigParams } from 'toastify-react-native/utils/interfaces';
import { Colors } from '@/constants/Colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ThemedText } from '../ThemedText';

const toastConfig = {
  success: (props: ToastConfigParams) => (
    <View className="elevation-lg w-4/5 flex-row items-center rounded-xl bg-sway-bright px-4 py-3 shadow-md shadow-sway-bright">
      <MaterialCommunityIcons name="check-circle" size={22} color={Colors.sway.dark} style={{ marginRight: 10 }} />
      <View className="flex-1">
        <ThemedText onLight type="smallTitle" style={{ marginBottom: 2 }}>
          {props.text1}
        </ThemedText>
        {props.text2 && (
          <ThemedText onLight style={{ marginBottom: 0 }}>
            {props.text2}
          </ThemedText>
        )}
      </View>
    </View>
  ),

  error: (props: ToastConfigParams) => (
    <View
      className="elevation-lg w-4/5 flex-row items-center rounded-xl bg-error px-4 py-3 shadow-md shadow-error"
      style={{
        backgroundColor: Colors.primary.error,
        elevation: 6,
        shadowColor: '#000'
      }}
    >
      <MaterialCommunityIcons name="alert-circle" size={22} color={Colors.primary.white} style={{ marginRight: 10 }} />
      <View className="flex-1">
        <ThemedText type="smallTitle" style={{ marginBottom: 2 }}>
          {props.text1}
        </ThemedText>
        {props.text2 && (
          <ThemedText onLight style={{ marginBottom: 0 }}>
            {props.text2}
          </ThemedText>
        )}
      </View>
    </View>
  )
};

export default toastConfig;
