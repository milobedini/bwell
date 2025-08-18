import React, { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { Dialog, Divider, IconButton, List, Portal, TextInput } from 'react-native-paper';
import { LoadingIndicator } from '@/components/LoadingScreen';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import usePickerConstants from '@/utils/usePickerConstants';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

type BaseItem = { _id: string; title: string; subtitle?: string };

type SearchPickerDialogProps<T extends BaseItem> = {
  visible: boolean;
  onDismiss: () => void;
  items?: T[];
  isPending?: boolean;
  isError?: boolean;
  title?: string;
  onSelect: (item: T) => void;
  leftIcon?: (item: T) => IconName;
  rightIcon?: (item: T) => IconName;
};

export default function SearchPickerDialog<T extends BaseItem>({
  visible,
  onDismiss,
  items,
  isPending,
  isError,
  title = 'Select',
  onSelect,
  leftIcon,
  rightIcon
}: SearchPickerDialogProps<T>) {
  const { dialogHeight, verticalMargin } = usePickerConstants();

  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    if (!items) return [];
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => it.title.toLowerCase().includes(q) || it.subtitle?.toLowerCase().includes(q));
  }, [items, query]);

  const renderRow = ({ item }: { item: T }) => (
    <List.Item
      key={item._id}
      title={item.title}
      titleStyle={{ fontFamily: Fonts.Bold }}
      description={item.subtitle}
      descriptionStyle={{ fontFamily: Fonts.Regular, overflow: 'hidden' }}
      onPress={() => {
        onSelect(item);
        onDismiss();
      }}
      left={(props) =>
        leftIcon ? (
          <List.Icon
            {...props}
            icon={() => <MaterialCommunityIcons name={leftIcon(item)} size={32} />}
            color={Colors.sway.darkGrey}
            style={{ paddingLeft: 0 }}
          />
        ) : null
      }
      right={(props) => (
        <List.Icon
          {...props}
          icon={() => {
            if (rightIcon)
              return <MaterialCommunityIcons name={rightIcon(item)} size={32} color={Colors.sway.bright} />;
            return <MaterialCommunityIcons name="plus-circle" size={32} color={Colors.sway.bright} />;
          }}
          color={Colors.sway.bright}
          style={{ paddingRight: 0 }}
        />
      )}
      style={{ paddingLeft: 0, paddingRight: 0 }}
    />
  );

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        style={{ height: dialogHeight, alignSelf: 'center', width: '90%', marginVertical: verticalMargin }}
        dismissableBackButton
      >
        <Dialog.Title>
          <ThemedText type="subtitle" className="text-center" onLight>
            {title}
          </ThemedText>
        </Dialog.Title>

        <Dialog.Content style={{ paddingBottom: 0 }}>
          {isPending ? (
            <View className="h-full">
              <LoadingIndicator marginBottom={0} />
            </View>
          ) : isError ? (
            <ThemedText type="error">
              <List.Item title={`Failed to load ${title.toLowerCase()}`} />
            </ThemedText>
          ) : (
            <TextInput
              placeholder={`Search ${title.toLowerCase()}…`}
              value={query}
              onChangeText={setQuery}
              clearButtonMode="while-editing"
            />
          )}
        </Dialog.Content>

        {!isPending && !isError && (
          <Dialog.ScrollArea style={{ height: '100%' }}>
            {filtered.length === 0 ? (
              <List.Item title="No results" />
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(m) => m._id}
                renderItem={renderRow}
                ItemSeparatorComponent={() => <Divider bold />}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 12 }}
              />
            )}
          </Dialog.ScrollArea>
        )}
        <Dialog.Actions>
          <IconButton
            icon={() => <MaterialIcons name="cancel" color={Colors.primary.error} size={36} />}
            onPress={onDismiss}
            aria-label="cancel"
          />
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

export type { IconName };
