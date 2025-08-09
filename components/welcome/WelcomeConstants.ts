import type { ImageSourcePropType } from 'react-native';

import connectImage from './images/connect.png';
import growImage from './images/grow.png';
import reflectImage from './images/reflect.png';

const titles = ['reflect', 'connect', 'grow'];
const descriptions = [
  'Understand yourself better. Log moods, thoughts, and daily patterns — and see how your experiences connect using simple CBT tools like the 5 Areas Model and thought diaries.',
  'Work side-by-side with your therapist or wellbeing practitioner. Share your progress, complete weekly check-ins, and keep all your CBT homework in one secure, easy-to-use space.',
  'Turn insights into action. Set goals, challenge unhelpful thoughts, and track your progress over time — building the resilience, clarity, and confidence to move forward.'
];
const images = [reflectImage, connectImage, growImage];

export const welcomeConstants = {
  indicatorSize: 12,
  spacing: 14,
  buttonSize: 64,
  data: [...Array(3).keys()].map((i) => ({
    key: i,
    title: titles[i],
    description: descriptions[i],
    image: images[i]
  }))
};

export type WelcomeDataType = {
  key: number;
  title: string;
  description: string;
  image: ImageSourcePropType;
};
