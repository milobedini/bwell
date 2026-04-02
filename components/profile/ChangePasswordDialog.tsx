import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button, Dialog, Portal, TextInput } from 'react-native-paper';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useChangePassword } from '@/hooks/useAuth';

type ChangePasswordDialogProps = {
  visible: boolean;
  onDismiss: () => void;
};

const ChangePasswordDialog = ({ visible, onDismiss }: ChangePasswordDialogProps) => {
  const { mutate, isPending } = useChangePassword();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    if (visible) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setShowCurrent(false);
      setShowNew(false);
    }
  }, [visible]);

  const handleSave = useCallback(() => {
    if (!currentPassword) {
      setError('Current password is required');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    mutate({ currentPassword, newPassword }, { onSuccess: onDismiss });
  }, [currentPassword, newPassword, confirmPassword, mutate, onDismiss]);

  const canSubmit = currentPassword.length > 0 && newPassword.length >= 8 && confirmPassword.length > 0;
  const inputStyle = { backgroundColor: Colors.chip.darkCard };

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        dismissableBackButton
        style={{ alignSelf: 'center', width: '90%' }}
      >
        <Dialog.Title>
          <ThemedText type="subtitle">Change Password</ThemedText>
        </Dialog.Title>

        <Dialog.Content>
          <View className="gap-3">
            <TextInput
              mode="outlined"
              label="Current password"
              value={currentPassword}
              onChangeText={(text) => {
                setCurrentPassword(text);
                if (error) setError('');
              }}
              secureTextEntry={!showCurrent}
              right={
                <TextInput.Icon icon={showCurrent ? 'eye-off' : 'eye'} onPress={() => setShowCurrent((v) => !v)} />
              }
              autoFocus
              disabled={isPending}
              style={inputStyle}
            />
            <TextInput
              mode="outlined"
              label="New password"
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                if (error) setError('');
              }}
              secureTextEntry={!showNew}
              right={<TextInput.Icon icon={showNew ? 'eye-off' : 'eye'} onPress={() => setShowNew((v) => !v)} />}
              disabled={isPending}
              style={inputStyle}
            />
            <TextInput
              mode="outlined"
              label="Confirm new password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (error) setError('');
              }}
              secureTextEntry={!showNew}
              disabled={isPending}
              style={inputStyle}
            />
            {!!error && <ThemedText type="error">{error}</ThemedText>}
          </View>
        </Dialog.Content>

        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={isPending} textColor={Colors.primary.error}>
            Cancel
          </Button>
          <Button onPress={handleSave} disabled={isPending || !canSubmit} textColor={Colors.sway.bright}>
            Save
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

export default ChangePasswordDialog;
