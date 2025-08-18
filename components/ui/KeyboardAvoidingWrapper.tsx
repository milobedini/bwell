import { KeyboardAvoidingView, type KeyboardAvoidingViewProps, Platform } from 'react-native';
import { clsx } from 'clsx';
import Constants from 'expo-constants';

const KeyboardAvoidingWrapper = ({ children, keyboardVerticalOffset, className }: KeyboardAvoidingViewProps) => {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className={clsx('flex-1', className)}
      keyboardVerticalOffset={keyboardVerticalOffset || Constants.statusBarHeight}
    >
      {children}
    </KeyboardAvoidingView>
  );
};

export default KeyboardAvoidingWrapper;
