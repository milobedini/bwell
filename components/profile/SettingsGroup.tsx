import { type ReactNode } from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';

type SettingsGroupProps = {
  title?: string;
  children: ReactNode;
};

const SettingsGroup = ({ title, children }: SettingsGroupProps) => {
  const validChildren = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];

  return (
    <View className="mx-4 mb-4">
      {title && (
        <ThemedText
          type="small"
          style={{
            color: Colors.sway.darkGrey,
            marginBottom: 8,
            marginLeft: 4,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            fontSize: 12,
            lineHeight: 16
          }}
        >
          {title}
        </ThemedText>
      )}

      <View
        className="overflow-hidden rounded-2xl"
        style={{
          backgroundColor: Colors.chip.darkCard,
          borderWidth: 1,
          borderColor: Colors.divider.light
        }}
      >
        {validChildren.map((child, index) => (
          <View key={index}>
            {index > 0 && (
              <View
                style={{
                  height: 1,
                  backgroundColor: Colors.divider.light,
                  marginLeft: 52
                }}
              />
            )}
            {child}
          </View>
        ))}
      </View>
    </View>
  );
};

export default SettingsGroup;
