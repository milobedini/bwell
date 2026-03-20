import { useCallback, useRef } from 'react';
import { Text } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';
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
import KeyboardAvoidingWrapper from '@/components/ui/KeyboardAvoidingWrapper';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useRegister } from '@/hooks/useAuth';
import { UserRole } from '@/types/types';
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetScrollView,
  BottomSheetTextInput
} from '@gorhom/bottom-sheet';
import { type RegisterInput } from '@milobedini/shared-types';

import assetId from '../../components/sign-up/leaves.mp4';

const videoSource: VideoSource = { assetId };

const SignupSchema = Yup.object().shape({
  username: Yup.string().min(3, 'Username must be at least 3 characters').required('Username is required'),
  email: Yup.string().email('Please enter a valid email address').required('Email or username is required'),
  password: Yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  roles: Yup.array()
    .of(Yup.mixed<UserRole>().oneOf(Object.values(UserRole), 'Invalid role provided'))
    .min(1, 'At least one role is required')
});

const AnimatedText = motify(Text)();

export default function Signup() {
  const register = useRegister();
  const { isPending } = register;
  const router = useRouter();

  const initialValues: RegisterInput = { username: '', email: '', password: '', roles: [UserRole.PATIENT] };

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
      <AuthVideoBackground videoSource={videoSource} heading={`Take back \ncontrol`} onUnlock={showModal}>
        <BottomSheetModal
          ref={bottomSheetModalRef}
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore"
          handleComponent={() => <AuthSheetHandle onPress={hideModal} />}
        >
          <KeyboardAvoidingWrapper>
            <BottomSheetScrollView
              contentContainerStyle={{
                paddingHorizontal: 16 * 2,
                paddingVertical: 16 * 2,
                flex: 1
              }}
              keyboardShouldPersistTaps="handled"
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
                Sign Up
              </AnimatedText>
              <MotiView state={dynamicAnimation} delay={300}>
                <Formik
                  initialValues={initialValues}
                  validationSchema={SignupSchema}
                  onSubmit={(values) => {
                    register.mutate(values, {
                      onSuccess: (res) => {
                        const id = String(res.user._id);
                        router.replace({
                          pathname: '/(auth)/verify',
                          params: { userId: id }
                        });
                      }
                    });
                  }}
                >
                  {({ handleSubmit, values, submitCount, errors, handleBlur, handleChange, setFieldValue }) => {
                    const submitted = submitCount > 0;
                    const buttonDisabled = isPending;
                    return (
                      <>
                        <BottomSheetTextInput
                          autoCapitalize="none"
                          autoComplete="email"
                          autoCorrect={false}
                          autoFocus
                          clearButtonMode="while-editing"
                          editable={!isPending}
                          placeholder="Email"
                          placeholderTextColor={'black'}
                          returnKeyType="send"
                          textContentType="emailAddress"
                          onSubmitEditing={() => handleSubmit()}
                          value={values.email}
                          keyboardType="email-address"
                          onChangeText={handleChange('email')}
                          onBlur={handleBlur('email')}
                          className="h-[64px] rounded border-b-[1px] border-b-black"
                        />
                        {submitted && errors.email && <ThemedText type="error">{errors.email}</ThemedText>}
                        <BottomSheetTextInput
                          autoCapitalize="none"
                          autoComplete="username"
                          autoCorrect={false}
                          clearButtonMode="while-editing"
                          editable={!isPending}
                          placeholder="Username"
                          placeholderTextColor={'black'}
                          returnKeyType="send"
                          textContentType="username"
                          onSubmitEditing={() => handleSubmit()}
                          value={values.username}
                          onChangeText={handleChange('username')}
                          onBlur={handleBlur('username')}
                          className="h-[64px] rounded border-b-[1px] border-b-black"
                        />
                        {submitted && errors.username && <ThemedText type="error">{errors.username}</ThemedText>}
                        <BottomSheetTextInput
                          autoCapitalize="none"
                          autoComplete="password-new"
                          autoCorrect={false}
                          clearButtonMode="while-editing"
                          editable={!isPending}
                          enablesReturnKeyAutomatically
                          placeholder="Password"
                          placeholderTextColor={'black'}
                          returnKeyType="send"
                          textContentType="newPassword"
                          onSubmitEditing={() => handleSubmit()}
                          secureTextEntry
                          value={values.password}
                          onChangeText={handleChange('password')}
                          onBlur={handleBlur('password')}
                          className="h-[64px] rounded border-b-[1px] border-b-black"
                        />
                        {submitted && errors.password && <ThemedText type="error">{errors.password}</ThemedText>}
                        <SegmentedButtons
                          value={values.roles[0] || ''}
                          onValueChange={(role) => {
                            setFieldValue('roles', [role]);
                          }}
                          style={{ marginTop: 16 }}
                          buttons={[
                            {
                              value: 'patient',
                              label: 'Patient',
                              checkedColor: Colors.sway.dark,
                              uncheckedColor: 'white',
                              style: {
                                backgroundColor: values.roles[0] === 'patient' ? Colors.sway.bright : Colors.sway.dark
                              }
                            },
                            {
                              value: 'therapist',
                              label: 'Therapist',
                              checkedColor: Colors.sway.dark,
                              uncheckedColor: 'white',
                              style: {
                                backgroundColor: values.roles[0] === 'therapist' ? Colors.sway.bright : Colors.sway.dark
                              }
                            }
                          ]}
                        />

                        <MotiView
                          state={dynamicAnimation}
                          delay={500}
                          style={{ justifyContent: 'center', marginTop: 16 }}
                        >
                          <AuthSubmitButton
                            label="Sign Up"
                            loadingLabel="Signing up..."
                            isPending={isPending}
                            disabled={buttonDisabled}
                            onPress={() => handleSubmit()}
                          />
                          <AuthLink href="/(auth)/login" label="Have an account?" />
                        </MotiView>
                      </>
                    );
                  }}
                </Formik>
              </MotiView>
            </BottomSheetScrollView>
          </KeyboardAvoidingWrapper>
        </BottomSheetModal>
      </AuthVideoBackground>
    </BottomSheetModalProvider>
  );
}
