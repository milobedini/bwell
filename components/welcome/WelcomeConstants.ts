const titles = ['reflect', 'connect', 'grow'];
const descriptions = [
  'Track your thoughts, moods, and behaviours in one place. Built on proven CBT techniques, our app helps you identify patterns and gain self-awareness with daily check-ins and guided journaling.',
  'Work collaboratively with your therapist. Share session notes, homework progress, and reflections between appointments — so nothing gets lost, and everything builds toward your goals.',
  'Turn insights into action. Set personalized reminders, complete structured CBT exercises, and see your growth over time — all designed to help you build resilience, clarity, and control.'
];
const images = [
  'https://picsum.photos/id/1011/900/1600', // abstract reflection / journal
  'https://picsum.photos/id/1012/900/1600', // human connection / warm moment
  'https://picsum.photos/id/1013/900/1600' // nature path / growth metaphor
];

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
  image: string;
};
