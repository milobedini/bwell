import { isAxiosError } from 'axios';

const axiosErrorString = (error: unknown): string => {
  if (isAxiosError(error)) {
    // If it's an Axios error, return the response message or a generic message
    return error.response?.data?.message || 'An error occurred while processing your request.';
  } else if (error instanceof Error) {
    // If it's a standard Error, return its message
    return error.message;
  }
  // Fallback for any other type of error
  return 'An unknown error occurred.';
};
export default axiosErrorString;
