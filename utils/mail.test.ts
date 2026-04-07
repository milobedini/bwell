import { Linking, Platform } from 'react-native';

import { pickClientAndCompose } from './mail';

jest.mock('react-native', () => ({
  Linking: {
    canOpenURL: jest.fn(),
    openURL: jest.fn()
  },
  Platform: { OS: 'ios' }
}));

jest.mock('expo-intent-launcher', () => ({
  startActivityAsync: jest.fn()
}));

jest.mock('expo-mail-composer', () => ({
  isAvailableAsync: jest.fn(),
  composeAsync: jest.fn()
}));

jest.mock('@/components/toast/toastOptions', () => ({
  renderErrorToast: jest.fn()
}));

const MailComposer = require('expo-mail-composer');
const IntentLauncher = require('expo-intent-launcher');
const { renderErrorToast } = require('@/components/toast/toastOptions');

const OPTIONS = {
  recipients: ['test@example.com'],
  subject: 'Help',
  body: 'Hello'
};

describe('pickClientAndCompose', () => {
  beforeEach(() => jest.clearAllMocks());

  it('uses MailComposer.composeAsync when available', async () => {
    MailComposer.isAvailableAsync.mockResolvedValue(true);
    MailComposer.composeAsync.mockResolvedValue({ status: 'sent' });

    const result = await pickClientAndCompose(OPTIONS);

    expect(MailComposer.composeAsync).toHaveBeenCalledWith(OPTIONS);
    expect(result).toEqual({ status: 'sent' });
  });

  describe('when MailComposer is unavailable', () => {
    beforeEach(() => {
      MailComposer.isAvailableAsync.mockResolvedValue(false);
    });

    it('tries Gmail app on iOS first', async () => {
      (Platform as unknown as { OS: string }).OS = 'ios';
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
      (Linking.openURL as jest.Mock).mockResolvedValue(undefined);

      await pickClientAndCompose(OPTIONS);

      expect(Linking.canOpenURL).toHaveBeenCalledWith(expect.stringContaining('googlegmail://'));
      expect(Linking.openURL).toHaveBeenCalledWith(expect.stringContaining('googlegmail://'));
    });

    it('tries Android intent for Gmail on Android', async () => {
      (Platform as unknown as { OS: string }).OS = 'android';
      IntentLauncher.startActivityAsync.mockResolvedValue(undefined);

      await pickClientAndCompose(OPTIONS);

      expect(IntentLauncher.startActivityAsync).toHaveBeenCalledWith(
        'android.intent.action.SENDTO',
        expect.objectContaining({ packageName: 'com.google.android.gm' })
      );
    });

    it('falls back to mailto: when Gmail is unavailable on iOS', async () => {
      (Platform as unknown as { OS: string }).OS = 'ios';
      // First canOpenURL (gmail) -> false, second (mailto) -> true
      (Linking.canOpenURL as jest.Mock).mockResolvedValueOnce(false).mockResolvedValueOnce(true);
      (Linking.openURL as jest.Mock).mockResolvedValue(undefined);

      await pickClientAndCompose(OPTIONS);

      expect(Linking.openURL).toHaveBeenCalledWith(expect.stringContaining('mailto:'));
    });

    it('falls back to web Gmail when mailto is unavailable', async () => {
      (Platform as unknown as { OS: string }).OS = 'ios';
      (Linking.canOpenURL as jest.Mock)
        .mockResolvedValueOnce(false) // gmail app
        .mockResolvedValueOnce(false) // mailto
        .mockResolvedValueOnce(true); // web gmail
      (Linking.openURL as jest.Mock).mockResolvedValue(undefined);

      await pickClientAndCompose(OPTIONS);

      expect(Linking.openURL).toHaveBeenCalledWith(expect.stringContaining('mail.google.com'));
    });

    it('shows error toast when no email option is available', async () => {
      (Platform as unknown as { OS: string }).OS = 'ios';
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);

      await pickClientAndCompose(OPTIONS);

      expect(renderErrorToast).toHaveBeenCalledWith('No email app or Gmail found.');
    });

    it('falls through to mailto on Android when Gmail intent fails', async () => {
      (Platform as unknown as { OS: string }).OS = 'android';
      IntentLauncher.startActivityAsync.mockRejectedValue(new Error('not found'));
      (Linking.canOpenURL as jest.Mock).mockResolvedValueOnce(true);
      (Linking.openURL as jest.Mock).mockResolvedValue(undefined);

      await pickClientAndCompose(OPTIONS);

      expect(Linking.openURL).toHaveBeenCalledWith(expect.stringContaining('mailto:'));
    });
  });
});
