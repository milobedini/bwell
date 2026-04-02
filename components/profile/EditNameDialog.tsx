import { useCallback, useEffect, useState } from 'react';
import { Button, Dialog, Portal, TextInput } from 'react-native-paper';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useUpdateName } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';

type EditNameDialogProps = {
  visible: boolean;
  onDismiss: () => void;
};

const EditNameDialog = ({ visible, onDismiss }: EditNameDialogProps) => {
  const user = useAuthStore((s) => s.user);
  const { mutate, isPending } = useUpdateName();
  const [name, setName] = useState(user?.name ?? '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setName(user?.name ?? '');
      setError('');
    }
  }, [visible, user?.name]);

  const handleSave = useCallback(() => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    if (trimmed.length > 50) {
      setError('Name cannot exceed 50 characters');
      return;
    }
    mutate({ newName: trimmed, userId: user?._id ?? '' }, { onSuccess: onDismiss });
  }, [name, mutate, user?._id, onDismiss]);

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        dismissableBackButton
        style={{ alignSelf: 'center', width: '90%' }}
      >
        <Dialog.Title>
          <ThemedText type="subtitle">Edit Name</ThemedText>
        </Dialog.Title>

        <Dialog.Content>
          <TextInput
            mode="outlined"
            label="Name"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (error) setError('');
            }}
            autoFocus
            maxLength={50}
            disabled={isPending}
            style={{ backgroundColor: Colors.chip.darkCard }}
          />
          {!!error && (
            <ThemedText type="error" className="mt-1">
              {error}
            </ThemedText>
          )}
        </Dialog.Content>

        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={isPending} textColor={Colors.primary.error}>
            Cancel
          </Button>
          <Button onPress={handleSave} disabled={isPending || name.trim().length < 2} textColor={Colors.sway.bright}>
            Save
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

export default EditNameDialog;
