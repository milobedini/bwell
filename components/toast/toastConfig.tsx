import { View } from 'react-native';
import type { ToastConfigParams } from 'toastify-react-native/utils/interfaces';
import { Colors } from '@/constants/Colors';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

import { ThemedText } from '../ThemedText';

const toastConfig = {
  success: (props: ToastConfigParams) => (
    <View className="elevation-lg w-4/5 flex-row items-center justify-center rounded-lg bg-sway-bright px-4 py-3 shadow-md shadow-sway-bright">
      <MaterialCommunityIcons name="check-circle" size={22} color={Colors.sway.dark} style={{ paddingHorizontal: 8 }} />
      <View className="mr-2 py-2">
        <ThemedText onLight type="smallTitle">
          {props.text1}
        </ThemedText>
        {props.text2 && (
          <ThemedText onLight style={{ marginTop: 12 }}>
            {props.text2}
          </ThemedText>
        )}
      </View>
    </View>
  ),
  error: (props: ToastConfigParams) => (
    <View className="elevation-lg w-4/5 flex-row items-center justify-center gap-2 rounded-lg bg-error px-4 py-3 shadow-md shadow-error">
      <MaterialCommunityIcons
        name="alert-circle"
        size={22}
        color={Colors.primary.white}
        style={{ paddingHorizontal: 8 }}
      />
      <View className="mr-2 py-2">
        <ThemedText type="smallTitle">{props.text1}</ThemedText>
        {props.text2 && (
          <ThemedText onLight style={{ marginTop: 12 }}>
            {props.text2}
          </ThemedText>
        )}
      </View>
    </View>
  )
};

export default toastConfig;
