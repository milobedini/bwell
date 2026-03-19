import { useCallback, useRef } from 'react';
import { toast } from 'sonner-native';
import { TOAST_DURATIONS, TOAST_STYLES } from '@/components/toast/toastOptions';
import { getServerErrorMessage } from '@/utils/axiosErrorString';
import { useMutation, type UseMutationOptions, type UseMutationResult } from '@tanstack/react-query';

export type ToastConfig<TData = unknown> = {
  pending: string;
  success: string | ((result: TData) => string);
  error?: string;
};

type UseMutationWithToastResult<TData, TError, TVariables, TContext> = UseMutationResult<
  TData,
  TError,
  TVariables,
  TContext
> & {
  mutateSilently: UseMutationResult<TData, TError, TVariables, TContext>['mutate'];
};

export const useMutationWithToast = <TData = unknown, TError = Error, TVariables = void, TContext = unknown>(
  options: UseMutationOptions<TData, TError, TVariables, TContext> & {
    toast: ToastConfig<TData>;
  }
): UseMutationWithToastResult<TData, TError, TVariables, TContext> => {
  const { toast: toastConfig, mutationFn, ...rest } = options;
  const silentRef = useRef(false);

  const wrappedMutationFn = mutationFn
    ? async (...args: Parameters<typeof mutationFn>): Promise<TData> => {
        const isSilent = silentRef.current;
        silentRef.current = false;

        const toastId = isSilent ? undefined : toast.loading(toastConfig.pending, { styles: TOAST_STYLES.loading });

        try {
          const result = await mutationFn(...args);
          const successMsg =
            typeof toastConfig.success === 'function' ? toastConfig.success(result) : toastConfig.success;

          if (toastId !== undefined) {
            toast.success(successMsg, {
              id: toastId,
              duration: TOAST_DURATIONS.success,
              styles: TOAST_STYLES.success
            });
          }

          return result;
        } catch (err) {
          const errorMsg = getServerErrorMessage(err);

          if (toastId !== undefined) {
            toast.error(errorMsg, {
              id: toastId,
              duration: TOAST_DURATIONS.error,
              styles: TOAST_STYLES.error
            });
          }

          throw err;
        }
      }
    : undefined;

  const mutation = useMutation<TData, TError, TVariables, TContext>({
    ...rest,
    mutationFn: wrappedMutationFn
  });

  const mutateSilently: typeof mutation.mutate = useCallback(
    (variables, mutateOptions) => {
      silentRef.current = true;
      mutation.mutate(variables, mutateOptions);
    },
    [mutation.mutate]
  );

  return { ...mutation, mutateSilently };
};
