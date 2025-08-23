import { Linking, Platform } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import * as MailComposer from 'expo-mail-composer';
import { renderErrorToast } from '@/components/toast/toastOptions';

async function tryOpenGmail(to: string, subject: string, body: string) {
  if (Platform.OS === 'ios') {
    const gmailUrl = `googlegmail://co?to=${encodeURIComponent(to)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const can = await Linking.canOpenURL(gmailUrl);
    if (can) {
      await Linking.openURL(gmailUrl);
      return true;
    }
  } else if (Platform.OS === 'android') {
    try {
      await IntentLauncher.startActivityAsync('android.intent.action.SENDTO', {
        data: `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
        packageName: 'com.google.android.gm'
      });
      return true;
    } catch {
      // Gmail not available
    }
  }
  return false;
}

export async function pickClientAndCompose(
  options: MailComposer.MailComposerOptions
): Promise<MailComposer.MailComposerResult | void> {
  const available = await MailComposer.isAvailableAsync();
  if (!available) {
    const to = options.recipients?.[0] ?? '';
    const subject = options.subject ?? '';
    const body = options.body ?? '';

    // 1) Gmail app?
    const openedGmail = await tryOpenGmail(to, subject, body);
    if (openedGmail) return;

    // 2) mailto: handler?
    const mailtoUrl = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    if (await Linking.canOpenURL(mailtoUrl)) {
      await Linking.openURL(mailtoUrl);
      return;
    }

    // 3) Web Gmail
    const webUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    if (await Linking.canOpenURL(webUrl)) {
      await Linking.openURL(webUrl);
      return;
    }

    // 4) Last resort
    return renderErrorToast('No email app or Gmail found.');
  }

  // ... (your same client picker + composeAsync code here)
  return MailComposer.composeAsync(options);
}
