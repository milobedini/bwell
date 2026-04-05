import { View } from 'react-native';
import Container from '@/components/Container';
import { ThemedText } from '@/components/ThemedText';

import type { AttemptPresenterProps } from '../AttemptPresenter';

const FiveAreasPresenter = ({ attempt: _attempt, mode: _mode, patientName: _patientName }: AttemptPresenterProps) => {
  return (
    <Container>
      <View className="flex-1 items-center justify-center p-4">
        <ThemedText type="subtitle">Five Areas Model</ThemedText>
        <ThemedText style={{ marginTop: 8 }}>Coming soon</ThemedText>
      </View>
    </Container>
  );
};

export default FiveAreasPresenter;
