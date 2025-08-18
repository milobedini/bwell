import { View } from 'react-native';
import { IconButton, List } from 'react-native-paper';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';

type SelectFieldProps = {
  label: string;
  value?: string;
  placeholder?: string;
  selected?: boolean;
  leftIcon?: string;
  onPress: () => void;
  onClear?: () => void;
  dense?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
};

const SelectField = ({
  label,
  value,
  placeholder = 'Select…',
  selected = false,
  leftIcon = 'account-circle-outline',
  onPress,
  onClear,
  dense = true,
  disabled = false,
  ...rest
}: SelectFieldProps) => {
  const descriptionColor = value ? Colors.primary.white : Colors.sway.lightGrey;

  const left = () => (
    <List.Icon
      icon={selected ? 'check-circle' : leftIcon}
      color={selected ? Colors.sway.bright : Colors.sway.lightGrey}
      {...rest}
    />
  );

  const right = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {selected && onClear ? (
        <IconButton
          icon="close-circle"
          onPress={onClear}
          accessibilityLabel={`Clear ${label}`}
          iconColor={Colors.primary.error}
        />
      ) : null}
      <List.Icon {...rest} icon="pencil" color={selected ? Colors.sway.lightGrey : Colors.sway.bright} />
    </View>
  );

  return (
    <List.Item
      title={value || placeholder}
      description={label}
      descriptionNumberOfLines={1}
      titleStyle={{ opacity: disabled ? 0.5 : 1, marginBottom: 0, color: descriptionColor, fontFamily: Fonts.Bold }}
      descriptionStyle={{ color: descriptionColor, fontFamily: Fonts.Regular }}
      left={left}
      right={right}
      onPress={onPress}
      disabled={disabled}
      style={{
        paddingVertical: dense ? 4 : 8,
        paddingHorizontal: 8
      }}
      accessibilityState={{ disabled, selected }}
      accessibilityRole="button"
    />
  );
};

export default SelectField;
