import { useState } from 'react';
import { TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Formik } from 'formik';
import * as Yup from 'yup';
import ContentContainer from '@/components/ContentContainer';
import ScrollContentContainer from '@/components/ScrollContentContainer';
import ThemedButton from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import { useLogin } from '@/hooks/useAuth';
import axiosErrorString from '@/utils/axiosErrorString';
import { LoginInput } from '@milobedini/shared-types';

const LoginSchema = Yup.object().shape({
  identifier: Yup.string().required('Email or username is required'),
  password: Yup.string().min(8, 'Password must be at least 8 characters').required('Password is required')
});

export default function Login() {
  const [apiError, setApiError] = useState('');

  const login = useLogin();
  const { isPending } = login;

  const router = useRouter();

  const initialValues: LoginInput = { identifier: '', password: '' };

  return (
    <ScrollContentContainer>
      <ThemedText type="subtitle">Login</ThemedText>
      {apiError && (
        <ThemedText type="italic" className="text-error">
          {apiError}
        </ThemedText>
      )}

      <Formik
        initialValues={initialValues}
        validationSchema={LoginSchema}
        onSubmit={(values) => {
          setApiError(''); // clear any old errors

          login.mutate(values, {
            onSuccess: () => {
              router.replace('/home');
            },
            onError: (error) => {
              setApiError(axiosErrorString(error));
            }
          });
        }}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
          <ContentContainer className="gap-4">
            <ThemedText>Email or Username</ThemedText>
            <TextInput
              value={values.identifier}
              onChangeText={handleChange('identifier')}
              onBlur={handleBlur('identifier')}
              placeholder="Enter username or email"
              className="rounded bg-white p-3"
            />
            {touched.identifier && errors.identifier && (
              <ThemedText className="text-error">{errors.identifier}</ThemedText>
            )}

            <ThemedText>Password</ThemedText>
            <TextInput
              value={values.password}
              onChangeText={handleChange('password')}
              onBlur={handleBlur('password')}
              placeholder="Enter password"
              secureTextEntry
              className="rounded bg-white p-3"
            />
            {touched.password && errors.password && <ThemedText className="text-error">{errors.password}</ThemedText>}

            <ThemedButton onPress={() => handleSubmit()} disabled={isPending}>
              {isPending ? 'Logging in...' : 'Login'}
            </ThemedButton>
          </ContentContainer>
        )}
      </Formik>
    </ScrollContentContainer>
  );
}
