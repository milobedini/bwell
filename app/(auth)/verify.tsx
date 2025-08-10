import { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, type TextInputProps } from 'react-native';
import { CodeField, Cursor, useBlurOnFulfill, useClearByFocusCell } from 'react-native-confirmation-code-field';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Container from '@/components/Container';
import ContentContainer from '@/components/ContentContainer';
import ThemedButton from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useUpdateName, useVerify } from '@/hooks/useAuth';
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
  focusCell: { borderColor: Colors.sway.lightGrey, color: Colors.sway.lightGrey }
});

const CELL_COUNT = 6;
const autoComplete = Platform.select<TextInputProps['autoComplete']>({ android: 'sms-otp', default: 'one-time-code' });

const VerifySchema = Yup.object().shape({
  verificationCode: Yup.string().length(6, '6 digits').required('Code is required'),
  newName: Yup.string().trim().min(2, 'Too short').required('Full name is required')
});

type VerifyForm = { verificationCode: string; newName: string };

const Verify = () => {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();

  const verifyEmail = useVerify();
  const updateName = useUpdateName();

  const [apiError, setApiError] = useState('');

  // CodeField helpers are controlled by Formik's value, so we init with empty
  const ref = useBlurOnFulfill({ value: '', cellCount: CELL_COUNT });
  const [propsCF, getCellOnLayoutHandler] = useClearByFocusCell({ value: '', setValue: () => {} });

  // Bubble errors to banner
  useEffect(() => {
    if (verifyEmail.isError) setApiError(axiosErrorString(verifyEmail.error));
  }, [verifyEmail.isError, verifyEmail.error]);
  useEffect(() => {
    if (updateName.isError) setApiError(axiosErrorString(updateName.error));
  }, [updateName.isError, updateName.error]);

  const isSubmittingCombined = verifyEmail.isPending || updateName.isPending;

  const handleSubmit = useCallback(
    async (values: VerifyForm) => {
      setApiError('');
      // 1) verify email
      await new Promise<void>((resolve, reject) => {
        verifyEmail.mutate(
          { verificationCode: values.verificationCode },
          {
            onSuccess: () => resolve(),
            onError: (e) => reject(e)
          }
        );
      });

      // 2) update name (only if we have a userId param)
      if (userId) {
        await new Promise<void>((resolve, reject) => {
          updateName.mutate(
            { userId: String(userId), newName: values.newName.trim() },
            {
              onSuccess: () => resolve(),
              onError: (e) => reject(e)
            }
          );
        });
      }

      // 3) go home
      router.replace('/home');
    },
    [router, updateName, userId, verifyEmail]
  );

  return (
    <Container>
      <ContentContainer className="mt-4 px-8">
        <ThemedText type="title" className="text-center">
          Verify your e-mail
        </ThemedText>

        <Formik<VerifyForm>
          initialValues={{ verificationCode: '', newName: '' }}
          validationSchema={VerifySchema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, setFieldValue, handleSubmit }) => {
            // wire CodeField to formik value
            const setCode = (code: string) => setFieldValue('verificationCode', code);
            return (
              <>
                <CodeField
                  ref={ref}
                  {...propsCF}
                  value={values.verificationCode}
                  onChangeText={setCode}
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
                {touched.verificationCode && errors.verificationCode && (
                  <ThemedText type="error" className="mt-2 text-center">
                    {errors.verificationCode}
                  </ThemedText>
                )}

                <TextInput
                  autoCorrect={false}
                  clearButtonMode="while-editing"
                  placeholder="Full name"
                  returnKeyType="send"
                  value={values.newName}
                  onChangeText={(text) => setFieldValue('newName', text)}
                  onSubmitEditing={() => handleSubmit()}
                  className="mt-4 h-[64px] rounded border-b-[1px] border-b-white text-lg text-white"
                  placeholderTextColor="white"
                />
                {touched.newName && errors.newName && (
                  <ThemedText type="error" className="mt-2 text-center">
                    {errors.newName}
                  </ThemedText>
                )}

                <ThemedButton
                  onPress={() => handleSubmit()}
                  className="mt-8"
                  disabled={isSubmittingCombined || values.verificationCode.length !== 6 || !values.newName.trim()}
                >
                  {isSubmittingCombined ? 'Submitting...' : 'Verify & Continue'}
                </ThemedButton>

                {apiError && (
                  <ThemedText type="error" className="mt-4 text-center">
                    {apiError}
                  </ThemedText>
                )}
              </>
            );
          }}
        </Formik>
      </ContentContainer>
    </Container>
  );
};

export default Verify;
