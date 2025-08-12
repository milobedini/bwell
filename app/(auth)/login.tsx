import { useCallback, useMemo, useRef, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useVideoPlayer, type VideoSource, VideoView } from 'expo-video';
import { Formik } from 'formik';
import { motify, MotiView, useDynamicAnimation } from 'moti';
import * as Yup from 'yup';
import { LoginLogo } from '@/components/sign-in/LoginLogo';
import { ThemedText } from '@/components/ThemedText';
import { renderErrorToast } from '@/components/toast/toastOptions';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useLogin } from '@/hooks/useAuth';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetModalProvider, BottomSheetView } from '@gorhom/bottom-sheet';
import { LoginInput } from '@milobedini/shared-types';

import assetId from '../../components/sign-in/waves.mp4';

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

const LoginSchema = Yup.object().shape({
  identifier: Yup.string().required('Email or username is required'),
  password: Yup.string().min(8, 'Password must be at least 8 characters').required('Password is required')
});

const { width, height } = Dimensions.get('screen');

const AnimatedText = motify(Text)();

export default function Login() {
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

  const login = useLogin();
  const { isPending } = login;

  const router = useRouter();

  const initialValues: LoginInput = { identifier: '', password: '' };

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const dynamicAnimation = useDynamicAnimation(() => ({
    opacity: 0,
    translateY: 40
  }));

  // variables
  const snapPoints = useMemo(() => ['87%'], []);

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
          <Text style={[styles.light, styles.heading]}>Keep building {'\n'}your momentum</Text>
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
          snapPoints={snapPoints}
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
          <BottomSheetView
            style={{
              paddingHorizontal: 16 * 2,
              paddingVertical: 16 * 2,
              justifyContent: 'space-between',
              flex: 1
            }}
          >
            <ScrollView contentContainerStyle={{ paddingBottom: '100%' }}>
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
                onPress={() => router.replace('/home')}
              >
                Welcome Back
              </AnimatedText>
              <MotiView state={dynamicAnimation} delay={300}>
                {apiError && <ThemedText type="error">{apiError}</ThemedText>}
                <Formik
                  initialValues={initialValues}
                  validationSchema={LoginSchema}
                  onSubmit={(values) => {
                    setApiError('');
                    login.mutate(values, {
                      onSuccess: () => {
                        router.replace('/home');
                      },
                      onError: (err) => renderErrorToast(err)
                    });
                  }}
                >
                  {({ handleSubmit, values, touched, errors, handleBlur, handleChange }) => (
                    <>
                      <TextInput
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoFocus
                        clearButtonMode="while-editing"
                        editable={!isPending}
                        placeholder="Email or Username"
                        returnKeyType="send"
                        onSubmitEditing={() => handleSubmit()}
                        value={values.identifier}
                        onChangeText={handleChange('identifier')}
                        onBlur={handleBlur('identifier')}
                        className="h-[64px] rounded border-b-[1px] border-b-black"
                      />
                      {touched.identifier && errors.identifier && (
                        <ThemedText type="error">{errors.identifier}</ThemedText>
                      )}
                      <TextInput
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

                      <MotiView
                        state={dynamicAnimation}
                        delay={500}
                        style={{ justifyContent: 'center', marginTop: 16 }}
                      >
                        <Pressable style={{ marginBottom: 16 }} onPress={() => handleSubmit()} disabled={isPending}>
                          <View
                            style={{
                              backgroundColor: Colors.sway.dark,
                              borderRadius: 16,
                              paddingVertical: 16,
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Text style={[styles.bold, { fontSize: 16, color: Colors.sway.bright }]}>
                              {isPending ? 'Logging in...' : 'Login'}
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
                          <Pressable onPress={() => router.replace('/(auth)/signup')}>
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
                              Need an account?
                            </Text>
                          </Pressable>
                        </View>
                      </MotiView>
                    </>
                  )}
                </Formik>
              </MotiView>
            </ScrollView>
          </BottomSheetView>
        </BottomSheetModal>
      </View>
    </BottomSheetModalProvider>
  );
}
