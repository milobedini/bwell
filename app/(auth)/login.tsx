import { useCallback, useRef } from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import type { VideoSource } from 'expo-video';
import { Formik } from 'formik';
import { motify, MotiView, useDynamicAnimation } from 'moti';
import * as Yup from 'yup';
import AuthLink from '@/components/auth/AuthLink';
import AuthSheetHandle from '@/components/auth/AuthSheetHandle';
import AuthSubmitButton from '@/components/auth/AuthSubmitButton';
import AuthVideoBackground from '@/components/auth/AuthVideoBackground';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useLogin } from '@/hooks/useAuth';
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetTextInput,
  BottomSheetView
} from '@gorhom/bottom-sheet';
import { LoginInput } from '@milobedini/shared-types';

import assetId from '../../components/sign-in/waves.mp4';

const videoSource: VideoSource = { assetId };

const LoginSchema = Yup.object().shape({
  identifier: Yup.string().required('Email or username is required'),
  password: Yup.string().min(8, 'Password must be at least 8 characters').required('Password is required')
});

const AnimatedText = motify(Text)();

export default function Login() {
  const login = useLogin();
  const { isPending } = login;
  const router = useRouter();

  const initialValues: LoginInput = { identifier: '', password: '' };

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const dynamicAnimation = useDynamicAnimation(() => ({
    opacity: 0,
    translateY: 40
  }));

  const hideModal = useCallback(() => {
    bottomSheetModalRef.current?.dismiss();
    dynamicAnimation.animateTo((current) => ({
      ...current,
      opacity: 0,
      translateY: 40
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showModal = useCallback(() => {
    bottomSheetModalRef.current?.present();
    setTimeout(
      () =>
        dynamicAnimation.animateTo((current) => ({
          ...current,
          opacity: 1,
          translateY: 0
        })),
      200
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <BottomSheetModalProvider>
      <AuthVideoBackground videoSource={videoSource} heading={`Keep building \nyour momentum`} onUnlock={showModal}>
        <BottomSheetModal
          ref={bottomSheetModalRef}
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore"
          handleComponent={() => <AuthSheetHandle onPress={hideModal} />}
        >
          <BottomSheetView
            style={{
              paddingHorizontal: 16 * 2,
              paddingVertical: 16 * 2,
              justifyContent: 'space-between',
              flex: 1
            }}
          >
            <AnimatedText
              state={dynamicAnimation}
              style={{
                fontWeight: '400',
                fontSize: 32,
                fontFamily: Fonts.Bold,
                color: Colors.sway.dark,
                marginBottom: 8
              }}
            >
              Welcome Back
            </AnimatedText>
            <MotiView state={dynamicAnimation} delay={300}>
              <Formik
                initialValues={initialValues}
                validationSchema={LoginSchema}
                onSubmit={(values) => {
                  login.mutate(values, {
                    onSuccess: () => router.replace('/home')
                  });
                }}
              >
                {({ handleSubmit, values, submitCount, errors, handleBlur, handleChange }) => {
                  const submitted = submitCount > 0;
                  const buttonDisabled = isPending;

                  return (
                    <>
                      <BottomSheetTextInput
                        autoCapitalize="none"
                        autoComplete="username"
                        autoCorrect={false}
                        autoFocus
                        clearButtonMode="while-editing"
                        editable={!isPending}
                        placeholder="Email or Username"
                        returnKeyType="send"
                        textContentType="username"
                        placeholderTextColor={'black'}
                        onSubmitEditing={() => handleSubmit()}
                        value={values.identifier}
                        onChangeText={handleChange('identifier')}
                        onBlur={handleBlur('identifier')}
                        className="h-[64px] rounded border-b-[1px] border-b-black"
                      />
                      {submitted && errors.identifier && <ThemedText type="error">{errors.identifier}</ThemedText>}
                      <BottomSheetTextInput
                        autoCapitalize="none"
                        autoComplete="password"
                        autoCorrect={false}
                        clearButtonMode="while-editing"
                        editable={!isPending}
                        enablesReturnKeyAutomatically
                        placeholder="Password"
                        placeholderTextColor={'black'}
                        returnKeyType="send"
                        textContentType="password"
                        onSubmitEditing={() => handleSubmit()}
                        secureTextEntry
                        value={values.password}
                        onChangeText={handleChange('password')}
                        onBlur={handleBlur('password')}
                        className="h-[64px] rounded border-b-[1px] border-b-black"
                      />
                      {submitted && errors.password && <ThemedText type="error">{errors.password}</ThemedText>}

                      <MotiView
                        state={dynamicAnimation}
                        delay={500}
                        style={{ justifyContent: 'center', marginTop: 16 }}
                      >
                        <AuthSubmitButton
                          label="Login"
                          loadingLabel="Logging in..."
                          isPending={isPending}
                          disabled={buttonDisabled}
                          onPress={() => handleSubmit()}
                        />
                        <AuthLink href="/(auth)/signup" label="Need an account?" />
                      </MotiView>
                    </>
                  );
                }}
              </Formik>
            </MotiView>
          </BottomSheetView>
        </BottomSheetModal>
      </AuthVideoBackground>
    </BottomSheetModalProvider>
  );
}
