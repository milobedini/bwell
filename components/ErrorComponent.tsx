import Container from './Container';
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
        <Container>
          <ThemedText>No content available</ThemedText>
        </Container>
      );
    case ErrorTypes.NOT_FOUND:
      return (
        <Container>
          <ThemedText>Resource not found</ThemedText>
        </Container>
      );
    case ErrorTypes.UNAUTHORIZED:
      return (
        <Container>
          <ThemedText>Unauthorized access</ThemedText>
        </Container>
      );
    case ErrorTypes.VALIDATION_ERROR:
      return (
        <Container>
          <ThemedText>Validation error occurred</ThemedText>
        </Container>
      );
    default:
      return (
        <Container>
          <ThemedText>Unknown error occurred</ThemedText>
        </Container>
      );
  }
};

export default ErrorComponent;
export { ErrorTypes };
