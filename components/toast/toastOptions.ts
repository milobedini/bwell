import { toast } from 'sonner-native';
import { getServerErrorMessage } from '@/utils/axiosErrorString';

export const renderSuccessToast = (title: string, description?: string) =>
  toast.success(title, { description, duration: 2000 });

export const renderCustomErrorToast = (title: string, description?: string) =>
  toast.error(title, { description, duration: 3500 });

export const renderErrorToast = (err: unknown) => toast.error(getServerErrorMessage(err), { duration: 3500 });
