import { isAxiosError } from 'axios';

type ServerError = {
  success?: boolean;
  message?: string;
  data?: {
    success?: boolean;
    message?: string;
  };
};

const axiosErrorString = (error: unknown): string => {
  if (isAxiosError<ServerError>(error)) {
    return (
      error.response?.data?.message ??
      error.response?.data?.data?.message ??
      'An error occurred while processing your request.'
    );
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred.';
};

const getServerErrorMessage = (err: unknown): string => {
  if (!isAxiosError<ServerError>(err)) {
    return err instanceof Error ? err.message : 'Something went wrong';
  }
  const data = err.response?.data;
  return data?.message ?? data?.data?.message ?? err.message ?? 'Something went wrong';
};

export { getServerErrorMessage };
export default axiosErrorString;
