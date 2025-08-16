import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { clsx } from 'clsx';

type ScrollContentContainerProps = {
  children: ReactNode;
  className?: string;
  centered?: boolean;
  noPadding?: boolean;
};

const ScrollContentContainer = ({ children, className, centered, noPadding }: ScrollContentContainerProps) => {
  const padding = noPadding ? {} : { paddingHorizontal: 16, paddingTop: 8 };
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: centered ? 'center' : 'flex-start',
          ...padding
        }}
        className={clsx('w-full', className)}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ScrollContentContainer;
