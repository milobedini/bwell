import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Button, Menu } from 'react-native-paper';
import { Colors } from '@/constants/Colors';

export type SortOption = 'name:asc' | 'name:desc' | 'createdAt:desc' | 'createdAt:asc' | 'lastLogin:desc';

type SortLabelMap = { value: SortOption; label: string };

const SORT_OPTIONS: SortLabelMap[] = [
  { value: 'name:asc', label: 'Name A-Z' },
  { value: 'name:desc', label: 'Name Z-A' },
  { value: 'createdAt:desc', label: 'Newest First' },
  { value: 'createdAt:asc', label: 'Oldest First' },
  { value: 'lastLogin:desc', label: 'Last Login' }
];

type SortButtonProps = {
  value: SortOption;
  onChange: (value: SortOption) => void;
};

const SortButton = ({ value, onChange }: SortButtonProps) => {
  const [visible, setVisible] = useState(false);

  const currentLabel = SORT_OPTIONS.find((o) => o.value === value)?.label ?? 'Sort';

  return (
    <>
      {visible && <Pressable style={StyleSheet.absoluteFill} onPress={() => setVisible(false)} />}
      <Menu
        visible={visible}
        onDismiss={() => setVisible(false)}
        anchor={
          <Button
            mode="outlined"
            icon="sort"
            onPress={() => setVisible(true)}
            textColor={Colors.sway.lightGrey}
            style={{ borderColor: Colors.sway.buttonBackgroundSolid }}
            compact
          >
            {currentLabel}
          </Button>
        }
        contentStyle={{ backgroundColor: Colors.sway.dark }}
      >
        {SORT_OPTIONS.map((opt) => (
          <Menu.Item
            key={opt.value}
            onPress={() => {
              onChange(opt.value);
              setVisible(false);
            }}
            title={opt.label}
            leadingIcon={opt.value === value ? 'check' : undefined}
            titleStyle={{
              color: opt.value === value ? Colors.sway.bright : Colors.sway.lightGrey
            }}
          />
        ))}
      </Menu>
    </>
  );
};

export default SortButton;
