import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { Dialog, Divider, IconButton, List, Portal, TextInput } from 'react-native-paper';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useAdminVerifyTherapist } from '@/hooks/useUsers';
import usePickerConstants from '@/utils/usePickerConstants';
import type { AuthUser } from '@milobedini/shared-types';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import MaterialIcons from '@react-native-vector-icons/material-icons';

import { LoadingIndicator } from '../LoadingScreen';
import { ThemedText } from '../ThemedText';
import { renderErrorToast, renderSuccessToast } from '../toast/toastOptions';

type TherapistPickerProps = {
  visible: boolean;
  onDismiss: () => void;
  therapists: AuthUser[];
};

// Todo - use generic picker.

const TherapistPicker = ({ visible, onDismiss, therapists }: TherapistPickerProps) => {
  const verifyTherapist = useAdminVerifyTherapist();
  const { dialogHeight, verticalMargin } = usePickerConstants();

  const { isPending, isError } = verifyTherapist;
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!therapists) return [];
    const q = query.trim().toLowerCase();
    if (!q) return therapists;
    return therapists.filter(
      (m) =>
        m?.name?.toLowerCase().includes(q) ||
        m.username?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q)
    );
  }, [therapists, query]);

  const handleSelect = (therapistId: string) => {
    verifyTherapist.mutate(
      { therapistId },
      {
        onSuccess: (res) => renderSuccessToast(res.message),
        onError: (err) => renderErrorToast(err)
      }
    );
  };

  const renderRow = ({ item }: { item: AuthUser }) => {
    return (
      <List.Item
        key={item._id}
        title={item.name || item.username}
        description={item.email}
        onPress={() => handleSelect(item._id)}
        titleStyle={{ fontFamily: Fonts.Bold }}
        descriptionStyle={{ fontFamily: Fonts.Regular }}
        style={{ paddingLeft: 0, paddingRight: 0 }}
        right={() => (
          <MaterialCommunityIcons
            name={'account-plus'}
            size={36}
            color={Colors.sway.bright}
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
            Verify therapist
          </ThemedText>
        </Dialog.Title>

        <Dialog.Content style={{ paddingBottom: 0 }}>
          {isPending ? (
            <View className="h-full">
              <LoadingIndicator marginBottom={verticalMargin} transparent />
            </View>
          ) : isError ? (
            <ThemedText type="error">
              <List.Item title="Failed to load therapists" />
            </ThemedText>
          ) : (
            <View>
              <TextInput
                placeholder="Search therapists..."
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
              <List.Item title={!query ? 'No therapists requiring verification' : 'No results'} />
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

export default TherapistPicker;
