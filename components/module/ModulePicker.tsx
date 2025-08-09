import { useMemo, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Dialog, IconButton, List, Portal, TextInput } from 'react-native-paper';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useEnrollUnenrollUser, useModules } from '@/hooks/useModules';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

import { ThemedText } from '../ThemedText';
import { renderErrorToast, renderSuccessToast } from '../toast/toastOptions';

type ModulePickerProps = {
  visible: boolean;
  onDismiss: () => void;
  patientId: string;
};

const ModulePicker = ({ visible, onDismiss, patientId }: ModulePickerProps) => {
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
      { patientId, moduleId },
      {
        onSuccess: (res) => {
          renderSuccessToast(res.message);
        },
        onError: (err) => {
          renderErrorToast(err.message);
        }
      }
    );
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>
          <ThemedText type="title" onLight>
            Assign a module
          </ThemedText>
        </Dialog.Title>
        <Dialog.Content>
          {isPending ? (
            <ActivityIndicator />
          ) : isError ? (
            <ThemedText type="error">
              <List.Item title="Failed to load modules" />
            </ThemedText>
          ) : (
            <>
              <TextInput placeholder="Search modules…" value={query} onChangeText={setQuery} />
              {filtered.length === 0 ? (
                <List.Item title="No modules found" />
              ) : (
                filtered.map((m) => {
                  const isAssigned = m.enrolled?.includes(patientId);
                  return (
                    <List.Item
                      key={m._id}
                      title={m.title}
                      description={m.description}
                      onPress={() => handleSelect(m._id)}
                      titleStyle={{
                        fontFamily: Fonts.Bold
                      }}
                      descriptionStyle={{
                        fontFamily: Fonts.Regular
                      }}
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
                })
              )}
            </>
          )}
        </Dialog.Content>
        <Dialog.Actions>
          <IconButton
            icon={() => <MaterialIcons name="cancel" color={Colors.primary.error} size={36} />}
            onPress={onDismiss}
          />
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

export default ModulePicker;
