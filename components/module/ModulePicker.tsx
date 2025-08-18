import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { Dialog, Divider, IconButton, List, Portal, TextInput } from 'react-native-paper';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useEnrollUnenrollUser, useModules } from '@/hooks/useModules';
import usePickerConstants from '@/utils/usePickerConstants';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import type { AuthUser, Module } from '@milobedini/shared-types';

import { LoadingIndicator } from '../LoadingScreen';
import { ThemedText } from '../ThemedText';
import { renderErrorToast, renderSuccessToast } from '../toast/toastOptions';

type ModulePickerProps = {
  visible: boolean;
  onDismiss: () => void;
  patient: AuthUser;
};

// Todo - use generic picker.

const ModulePicker = ({ visible, onDismiss, patient }: ModulePickerProps) => {
  const { dialogHeight, verticalMargin } = usePickerConstants();

  const { data: modules, isPending, isError } = useModules();
  const enrollUnenroll = useEnrollUnenrollUser();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!modules) return [];
    const q = query.trim().toLowerCase();
    if (!q) return modules;
    return modules.filter((m) => m.title.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q));
  }, [modules, query]);

  const handleSelect = (moduleId: string) => {
    enrollUnenroll.mutate(
      { patientId: patient._id, moduleId },
      {
        onSuccess: (res) => renderSuccessToast(res.message),
        onError: (err) => renderErrorToast(err)
      }
    );
  };

  const renderRow = ({ item }: { item: Module }) => {
    const isAssigned = item.enrolled?.includes(patient._id);
    return (
      <List.Item
        key={item._id}
        title={item.title}
        description={item.description}
        onPress={() => handleSelect(item._id)}
        titleStyle={{ fontFamily: Fonts.Bold }}
        descriptionStyle={{ fontFamily: Fonts.Regular }}
        style={{ paddingLeft: 0, paddingRight: 0 }}
        right={() => (
          <MaterialCommunityIcons
            name={isAssigned ? 'minus-circle' : 'plus-circle'}
            size={36}
            color={isAssigned ? Colors.primary.error : Colors.sway.bright}
            style={{ alignSelf: 'center' }}
          />
        )}
      />
    );
  };

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
            Enroll {patient.name || patient.username}
          </ThemedText>
        </Dialog.Title>

        <Dialog.Content style={{ paddingBottom: 0 }}>
          {isPending ? (
            <View className="h-full">
              <LoadingIndicator marginBottom={verticalMargin} transparent />
            </View>
          ) : isError ? (
            <ThemedText type="error">
              <List.Item title="Failed to load modules" />
            </ThemedText>
          ) : (
            <View>
              <TextInput
                placeholder="Search modules…"
                value={query}
                onChangeText={setQuery}
                clearButtonMode="while-editing"
              />
            </View>
          )}
        </Dialog.Content>

        {!isPending && !isError && (
          <Dialog.ScrollArea style={{ height: '100%' }}>
            {filtered.length === 0 ? (
              <List.Item title="No modules found" />
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(m) => m._id}
                renderItem={renderRow}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 12 }}
                ItemSeparatorComponent={() => <Divider bold />}
                showsVerticalScrollIndicator={false}
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
};

export default ModulePicker;
