import type { ComponentProps } from 'react';
import { View } from 'react-native';
import { Colors } from '@/constants/Colors';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

import ThemedButton from '../ThemedButton';
import { ThemedText } from '../ThemedText';

type EmptyStateProps = {
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
};

const EmptyState = ({ icon, title, subtitle, action }: EmptyStateProps) => (
  <View className="flex-1 items-center justify-center gap-4 p-8">
    <MaterialCommunityIcons name={icon} size={40} color={Colors.sway.darkGrey} />
    <ThemedText type="smallTitle" className="text-center">
      {title}
    </ThemedText>
    {subtitle ? (
      <ThemedText type="small" className="text-center text-sway-darkGrey">
        {subtitle}
      </ThemedText>
    ) : null}
    {action ? <ThemedButton title={action.label} onPress={action.onPress} compact /> : null}
  </View>
);

export default EmptyState;
