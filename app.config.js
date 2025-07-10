import 'dotenv/config';

export default {
  expo: {
    name: 'bwell',
    slug: 'bwell',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'bwell',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    owner: 'milobedini',
    runtimeVersion: {
      policy: 'appVersion'
    },
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      edgeToEdgeEnabled: true
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png'
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff'
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_BACKEND_BASE_URL,
      eas: {
        projectId: '2bff059e-0e09-4d11-8414-e062119c44a5'
      }
    },
    updates: {
      url: 'https://u.expo.dev/2bff059e-0e09-4d11-8414-e062119c44a5'
    }
  }
};
