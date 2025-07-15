import { View } from 'react-native';

import { ThemedText } from './ThemedText';

enum ErrorTypes {
  NO_CONTENT = 'NoContentError',
  NOT_FOUND = 'NotFoundError',
  UNAUTHORIZED = 'UnauthorizedError',
  VALIDATION_ERROR = 'ValidationError'
}

const ErrorComponent = ({ errorType }: { errorType: ErrorTypes }) => {
  switch (errorType) {
    case ErrorTypes.NO_CONTENT:
      return (
        <View>
          <ThemedText>No content available</ThemedText>
        </View>
      );
    case ErrorTypes.NOT_FOUND:
      return (
        <View>
          <ThemedText>Resource not found</ThemedText>
        </View>
      );
    case ErrorTypes.UNAUTHORIZED:
      return (
        <View>
          <ThemedText>Unauthorized access</ThemedText>
        </View>
      );
    case ErrorTypes.VALIDATION_ERROR:
      return (
        <View>
          <ThemedText>Validation error occurred</ThemedText>
        </View>
      );
    default:
      return (
        <View>
          <ThemedText>Unknown error occurred</ThemedText>
        </View>
      );
  }
};

export default ErrorComponent;
export { ErrorTypes };
