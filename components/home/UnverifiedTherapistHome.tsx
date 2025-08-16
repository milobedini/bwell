import { View } from 'react-native';

import ContentContainer from '../ContentContainer';
import { PendingChip } from '../ui/Chip';

import { HomeScreen } from './HomeScreen';

const content = (
  <ContentContainer>
    <View className="items-center justify-center">
      <PendingChip animate />
    </View>
  </ContentContainer>
);

const UnverifiedTherapistHome = () => {
  return <HomeScreen content={content} />;
};

export default UnverifiedTherapistHome;
