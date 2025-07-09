import { Platform, View } from 'react-native';
import Container from '@/components/Container';
import { ThemedText } from '@/components/ThemedText';

export default function HomeScreen() {
  return (
    <Container>
      <View>
        <ThemedText type="title">Welcome!</ThemedText>
      </View>
      <View>
        <ThemedText type="subtitle" className="color-success">
          Step 1: Try it
        </ThemedText>
        <ThemedText>
          Edit <ThemedText>app/(tabs)/index.tsx</ThemedText> to see changes. Press{' '}
          <ThemedText>
            {Platform.select({
              ios: 'cmd + d',
              android: 'cmd + m',
              web: 'F12'
            })}
          </ThemedText>{' '}
          to open developer tools.
        </ThemedText>
      </View>
      <View>
        <ThemedText type="subtitle">Step 2: Explore</ThemedText>
        <ThemedText>{`Tap the Explore tab to learn more about what's included in this starter app.`}</ThemedText>
      </View>
    </Container>
  );
}
