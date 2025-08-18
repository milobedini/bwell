import { KeyboardAvoidingView, type KeyboardAvoidingViewProps, Platform } from 'react-native';
import Constants from 'expo-constants';

const KeyboardAvoidingWrapper = ({ children }: KeyboardAvoidingViewProps) => {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
      keyboardVerticalOffset={Constants.statusBarHeight}
    >
      {children}
    </KeyboardAvoidingView>
  );
};

export default KeyboardAvoidingWrapper;
