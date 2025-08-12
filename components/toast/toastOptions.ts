import { Toast } from 'toastify-react-native';
import type { ToastPosition, ToastShowParams, ToastType } from 'toastify-react-native/utils/interfaces';

export const buildToast = (
  type: ToastType,
  title: string,
  description?: string,
  visibilityTime: number = 900,
  position: ToastPosition = 'bottom'
): ToastShowParams => ({
  type,
  text1: title,
  text2: description,
  position,
  autoHide: true,
  visibilityTime
});

export const successOptions = (title: string, description?: string): ToastShowParams =>
  buildToast('success', title, description);

export const errorOptions = (title: string, description?: string): ToastShowParams =>
  buildToast('error', title, description, 2500);

export const renderSuccessToast = (title: string, description?: string) =>
  Toast.show(successOptions(title, description));

export const renderErrorToast = (title: string, description?: string) => Toast.show(errorOptions(title, description));
