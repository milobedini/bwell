import { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, type TextInputProps } from 'react-native';
import { CodeField, Cursor, useBlurOnFulfill, useClearByFocusCell } from 'react-native-confirmation-code-field';
import { useRouter } from 'expo-router';
import Container from '@/components/Container';
import ContentContainer from '@/components/ContentContainer';
import ThemedButton from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useVerify } from '@/hooks/useAuth';
import axiosErrorString from '@/utils/axiosErrorString';

const styles = StyleSheet.create({
  codeFieldRoot: { marginTop: 20 },
  cell: {
    width: 40,
    height: 40,
    lineHeight: 38,
    fontSize: 24,
    borderWidth: 2,
    borderColor: Colors.sway.darkGrey,
    textAlign: 'center',
    color: Colors.sway.darkGrey
  },
  focusCell: {
    borderColor: Colors.sway.lightGrey,
    color: Colors.sway.lightGrey
  }
});

const CELL_COUNT = 6;
const autoComplete = Platform.select<TextInputProps['autoComplete']>({
  android: 'sms-otp',
  default: 'one-time-code'
});

const Verify = () => {
  const [value, setValue] = useState('');

  const verifyEmail = useVerify();
  const { isPending, isError, error, isSuccess } = verifyEmail;
  const router = useRouter();
  const [apiError, setApiError] = useState('');
  const ref = useBlurOnFulfill({ value, cellCount: CELL_COUNT });
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({
    value,
    setValue
  });

  const handleSubmit = useCallback(() => verifyEmail.mutate({ verificationCode: value }), [value, verifyEmail]);

  useEffect(() => {
    if (isError) {
      setApiError(axiosErrorString(error));
    }
  }, [isError, error]);

  useEffect(() => {
    if (isSuccess) {
      router.replace('/home');
    }
  }, [isSuccess, router]);

  return (
    <Container>
      <ContentContainer className="mt-4 px-8">
        <ThemedText type="title" className="text-center">
          Verify your e-mail
        </ThemedText>
        <CodeField
          ref={ref}
          {...props}
          // Use `caretHidden={false}` when users can't paste a text value, because context menu doesn't appear
          value={value}
          onChangeText={setValue}
          cellCount={CELL_COUNT}
          rootStyle={styles.codeFieldRoot}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete={autoComplete}
          testID="my-code-input"
          renderCell={({ index, symbol, isFocused }) => (
            <Text
              key={index}
              style={[styles.cell, isFocused && styles.focusCell]}
              onLayout={getCellOnLayoutHandler(index)}
            >
              {symbol || (isFocused && <Cursor />)}
            </Text>
          )}
        />
        <ThemedButton onPress={handleSubmit} className="mt-8" disabled={value.length !== 6}>
          {isPending ? 'Verifying...' : 'Verify'}
        </ThemedButton>
        {apiError && (
          <ThemedText type="error" className="mt-4 text-center">
            {apiError}
          </ThemedText>
        )}
      </ContentContainer>
    </Container>
  );
};

export default Verify;
