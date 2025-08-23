import { ActionSheetIOS, Alert, Platform } from 'react-native';
import * as MailComposer from 'expo-mail-composer';
import { renderCustomErrorToast } from '@/components/toast/toastOptions';

export async function pickClientAndCompose(
  options: MailComposer.MailComposerOptions
): Promise<MailComposer.MailComposerResult | void> {
  // 1) Check availability
  const available = await MailComposer.isAvailableAsync();
  if (!available) {
    return renderCustomErrorToast('Mail composer not available on this device.');
  }
  // 2) (Optional) Let the user pick a client (UX only; OS chooses the actual handler)
  const clients = MailComposer.getClients(); // MailClient[]
  if (clients.length > 1) {
    if (Platform.OS === 'ios') {
      const labels = clients.map((c) => c.label);
      return new Promise((resolve) => {
        ActionSheetIOS.showActionSheetWithOptions(
          { options: [...labels, 'Cancel'], cancelButtonIndex: labels.length, title: 'Send with' },
          async (idx) => {
            if (idx === labels.length) return resolve(undefined); // cancelled
            const result = await MailComposer.composeAsync(options); // prefills subject/body/etc
            resolve(result);
          }
        );
      });
    } else {
      // Minimal Android picker; replace with your own modal if you prefer
      return new Promise((resolve) => {
        const first = clients[0];
        Alert.alert(
          'Send with',
          `Use ${first.label}?`,
          [
            { text: 'Choose another', onPress: () => resolve(undefined), style: 'cancel' },
            {
              text: 'OK',
              onPress: async () => {
                const result = await MailComposer.composeAsync(options);
                resolve(result);
              }
            }
          ],
          { cancelable: true }
        );
      });
    }
  }

  // 3) If only one (or zero) client is listed, just compose with your options
  return MailComposer.composeAsync(options);
}
