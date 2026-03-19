import type { TextStyle, ViewStyle } from 'react-native';
import { toast } from 'sonner-native';
import { Colors } from '@/constants/Colors';
import { getServerErrorMessage } from '@/utils/axiosErrorString';

type StateStyle = {
  toast: ViewStyle;
  description: TextStyle;
};

export const TOAST_STYLES: Record<'loading' | 'success' | 'error', StateStyle> = {
  loading: {
    toast: { borderColor: Colors.sway.bright, borderWidth: 1 },
    description: { color: Colors.sway.darkGrey }
  },
  success: {
    toast: { borderColor: Colors.primary.success, borderWidth: 1 },
    description: { color: Colors.sway.darkGrey }
  },
  error: {
    toast: { borderColor: Colors.primary.error, borderWidth: 1 },
    description: { color: Colors.sway.lightGrey }
  }
};

export const TOAST_DURATIONS = {
  success: 2000,
  error: 3500
} as const;

export const renderSuccessToast = (title: string, description?: string) =>
  toast.success(title, { description, duration: 2000 });

export const renderCustomErrorToast = (title: string, description?: string) =>
  toast.error(title, { description, duration: 3500 });

export const renderErrorToast = (err: unknown) => toast.error(getServerErrorMessage(err), { duration: 3500 });
