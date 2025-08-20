import { useCallback, useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';
import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useVideoPlayer, type VideoSource, VideoView } from 'expo-video';
import { Formik } from 'formik';
import { motify, MotiView, useDynamicAnimation } from 'moti';
import * as Yup from 'yup';
import { LoginLogo } from '@/components/sign-in/LoginLogo';
import { ThemedText } from '@/components/ThemedText';
import { renderErrorToast } from '@/components/toast/toastOptions';
import KeyboardAvoidingWrapper from '@/components/ui/KeyboardAvoidingWrapper';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useRegister } from '@/hooks/useAuth';
import { UserRole } from '@/types/types';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetScrollView,
  BottomSheetTextInput
} from '@gorhom/bottom-sheet';
import { type RegisterInput } from '@milobedini/shared-types';

import assetId from '../../components/sign-up/leaves.mp4';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.sway.dark
  },
  content: {
    flex: 1
  },
  background: { flex: 0.7, marginTop: 20 },
  title: {
    textAlign: 'center',
    color: Colors.sway.lightGrey
  },
  form: {
    flexGrow: 1
  },
  image: {
    height: 500,
    width: 800,
    resizeMode: 'contain',
    alignSelf: 'center'
  },
  error: {
    color: Colors.primary.error,
    marginBottom: 8
  },
  light: {
    color: Colors.sway.lightGrey
  },
  heading: {
    fontSize: 36,
    fontWeight: '600'
  },
  regular: {
    fontWeight: '400'
  },
  bold: {
    fontWeight: '700'
  }
});

const SignupSchema = Yup.object().shape({
  username: Yup.string().min(3, 'Username must be at least 3 characters').required('Username is required'),
  email: Yup.string().email('Please enter a valid email address').required('Email or username is required'),
  password: Yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  roles: Yup.array()
    .of(Yup.mixed<UserRole>().oneOf(Object.values(UserRole), 'Invalid role provided'))
    .min(1, 'At least one role is required')
});

const { width, height } = Dimensions.get('screen');

const AnimatedText = motify(Text)();

export default function Signup() {
  const [apiError, setApiError] = useState('');

  const videoSource: VideoSource = {
    assetId
    //  useCaching: true
  };

  const player = useVideoPlayer(videoSource, (player) => {
    player.audioMixingMode = 'mixWithOthers';
    player.muted = true;
    player.loop = true;
    player.play();
  });

  const register = useRegister();
  const { isPending } = register;

  const router = useRouter();

  const initialValues: RegisterInput = { username: '', email: '', password: '', roles: [UserRole.PATIENT] };

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const dynamicAnimation = useDynamicAnimation(() => ({
    opacity: 0,
    translateY: 40
  }));

  // callbacks
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
      <StatusBar style="dark" />

      <View style={styles.container}>
        <VideoView style={[StyleSheet.absoluteFillObject, { opacity: 1 }]} player={player} nativeControls={false} />

        <View
          style={{
            padding: 16,
            flex: 1,
            justifyContent: 'flex-end',
            paddingBottom: height * 0.2
          }}
        >
          <LoginLogo />
          <Text style={[styles.light, styles.heading]}>Take back {'\n'}control</Text>
          <View
            style={{
              height: 2,
              width: width * 0.2,
              backgroundColor: '#fff',
              marginTop: 16 * 3
            }}
          />
        </View>
        <Pressable onPress={showModal}>
          <View
            style={{
              paddingVertical: 16,
              paddingBottom: 16 * 2,
              width: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: Colors.sway.dark,
              borderRadius: 32
            }}
          >
            <AntDesign name="lock1" size={32} color={Colors.sway.bright} />
          </View>
        </Pressable>
        <BottomSheetModal
          ref={bottomSheetModalRef}
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore"
          handleComponent={() => {
            return (
              <Pressable onPress={hideModal}>
                <View
                  style={{
                    height: 64,
                    borderBottomWidth: 1,
                    borderBottomColor: Colors.sway.bright,
                    backgroundColor: Colors.sway.dark,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <MaterialIcons
                    name="keyboard-arrow-down"
                    size={36}
                    color={Colors.sway.bright}
                    style={{
                      transform: [{ scaleX: 1.4 }, { scaleY: 1.4 }]
                    }}
                  />
                </View>
              </Pressable>
            );
          }}
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
                style={[
                  styles.regular,
                  {
                    fontSize: 32,
                    fontFamily: Fonts.Bold,
                    color: Colors.sway.dark,
                    marginBottom: 8
                  }
                ]}
              >
                Sign Up
              </AnimatedText>
              <MotiView state={dynamicAnimation} delay={300}>
                {apiError && <ThemedText type="error">{apiError}</ThemedText>}
                <Formik
                  initialValues={initialValues}
                  validationSchema={SignupSchema}
                  onSubmit={(values) => {
                    setApiError('');
                    register.mutate(values, {
                      onSuccess: (res) => {
                        const id = String(res.user._id);
                        router.replace({
                          pathname: '/(auth)/verify',
                          params: { userId: id }
                        });
                      },
                      onError: (err) => renderErrorToast(err)
                    });
                  }}
                >
                  {({
                    handleSubmit,
                    values,
                    touched,
                    errors,
                    handleBlur,
                    handleChange,
                    setFieldValue,
                    isValid,
                    isValidating
                  }) => {
                    const buttonDisabled = isPending || isValidating || !isValid;
                    return (
                      <>
                        <BottomSheetTextInput
                          autoCapitalize="none"
                          autoCorrect={false}
                          autoFocus
                          clearButtonMode="while-editing"
                          editable={!isPending}
                          placeholder="Email"
                          returnKeyType="send"
                          onSubmitEditing={() => handleSubmit()}
                          value={values.email}
                          keyboardType="email-address"
                          onChangeText={handleChange('email')}
                          onBlur={handleBlur('email')}
                          className="h-[64px] rounded border-b-[1px] border-b-black"
                        />
                        {touched.email && errors.email && <ThemedText type="error">{errors.email}</ThemedText>}
                        <BottomSheetTextInput
                          autoCapitalize="none"
                          autoCorrect={false}
                          clearButtonMode="while-editing"
                          editable={!isPending}
                          placeholder="Username"
                          returnKeyType="send"
                          onSubmitEditing={() => handleSubmit()}
                          value={values.username}
                          onChangeText={handleChange('username')}
                          onBlur={handleBlur('username')}
                          className="h-[64px] rounded border-b-[1px] border-b-black"
                        />
                        {touched.username && errors.username && <ThemedText type="error">{errors.username}</ThemedText>}
                        <BottomSheetTextInput
                          autoCapitalize="none"
                          autoCorrect={false}
                          clearButtonMode="while-editing"
                          editable={!isPending}
                          enablesReturnKeyAutomatically
                          placeholder="Password"
                          returnKeyType="send"
                          onSubmitEditing={() => handleSubmit()}
                          secureTextEntry
                          value={values.password}
                          onChangeText={handleChange('password')}
                          onBlur={handleBlur('password')}
                          className="h-[64px] rounded border-b-[1px] border-b-black"
                        />
                        {touched.password && errors.password && <ThemedText type="error">{errors.password}</ThemedText>}
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
                          <Pressable
                            style={{ marginBottom: 16 }}
                            onPress={() => handleSubmit()}
                            disabled={buttonDisabled}
                          >
                            <View
                              style={{
                                backgroundColor: buttonDisabled ? Colors.sway.darkGrey : Colors.sway.dark,
                                borderRadius: 16,
                                paddingVertical: 16,
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Text
                                style={[
                                  styles.bold,
                                  { fontSize: 16, color: buttonDisabled ? Colors.sway.white : Colors.sway.bright }
                                ]}
                              >
                                {isPending ? 'Signing up...' : 'Sign Up'}
                              </Text>
                            </View>
                          </Pressable>
                          <View
                            style={{
                              alignItems: 'center',
                              flexDirection: 'row',
                              alignSelf: 'center'
                            }}
                          >
                            <Link asChild href={'/(auth)/login'}>
                              <Pressable>
                                <Text
                                  style={[
                                    styles.bold,
                                    {
                                      fontSize: 16,
                                      color: '#053eff',
                                      marginLeft: 16 / 2
                                    }
                                  ]}
                                >
                                  Have an account?
                                </Text>
                              </Pressable>
                            </Link>
                          </View>
                        </MotiView>
                      </>
                    );
                  }}
                </Formik>
              </MotiView>
            </BottomSheetScrollView>
          </KeyboardAvoidingWrapper>
        </BottomSheetModal>
      </View>
    </BottomSheetModalProvider>
  );
}
