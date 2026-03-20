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
  const silentCountRef = useRef(0);

  const wrappedMutationFn = mutationFn
    ? async (...args: Parameters<typeof mutationFn>): Promise<TData> => {
        const isSilent = silentCountRef.current > 0;
        if (isSilent) silentCountRef.current -= 1;

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
          const errorMsg = toastConfig.error ?? getServerErrorMessage(err);

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
      silentCountRef.current += 1;
      mutation.mutate(variables, mutateOptions);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- depend on .mutate only; `mutation` is a new object every render
    [mutation.mutate]
  );

  return { ...mutation, mutateSilently };
};
