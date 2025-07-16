import type { ReactNode } from 'react';
import { useFonts } from 'expo-font';

import { LoadingIndicator } from './LoadingScreen';

type FontsContainerProps = {
  children: ReactNode;
};

const FontsContainer = ({ children }: FontsContainerProps) => {
  const [fontsLoaded] = useFonts({
    'Lato-Regular': require('../assets/fonts/Lato-Regular.ttf'),
    'Lato-Bold': require('../assets/fonts/Lato-Bold.ttf'),
    'Lato-Black': require('../assets/fonts/Lato-Black.ttf'),
    'Lato-Light': require('../assets/fonts/Lato-Light.ttf'),
    'Lato-Italic': require('../assets/fonts/Lato-Italic.ttf'),
    'Lato-BoldItalic': require('../assets/fonts/Lato-BoldItalic.ttf'),
    'Lato-BlackItalic': require('../assets/fonts/Lato-BlackItalic.ttf'),
    'Lato-LightItalic': require('../assets/fonts/Lato-LightItalic.ttf'),
    'Lato-Thin': require('../assets/fonts/Lato-Thin.ttf'),
    'Lato-ThinItalic': require('../assets/fonts/Lato-ThinItalic.ttf')
  });

  if (fontsLoaded) {
    return <>{children}</>;
  }

  return <LoadingIndicator marginBottom={0} />;
};

export default FontsContainer;
