import { render, screen } from '@testing-library/react-native';

import Sparkline from './Sparkline';

jest.mock('@shopify/react-native-skia', () => {
  const { View } = require('react-native');
  return {
    Canvas: (props: Record<string, unknown>) => <View testID="canvas" {...props} />,
    Path: () => null,
    Skia: {
      Path: { Make: () => ({ moveTo: jest.fn(), lineTo: jest.fn() }) },
      Paint: () => ({
        setColor: jest.fn(),
        setStrokeWidth: jest.fn(),
        setStyle: jest.fn(),
        setStrokeCap: jest.fn(),
        setStrokeJoin: jest.fn(),
        setAntiAlias: jest.fn()
      }),
      Color: (c: string) => c
    },
    PaintStyle: { Stroke: 1 },
    StrokeCap: { Round: 1 },
    StrokeJoin: { Round: 1 }
  };
});

describe('Sparkline', () => {
  it('returns null when data has fewer than 2 points', () => {
    const { toJSON } = render(<Sparkline data={[5]} />);

    expect(toJSON()).toBeNull();
  });

  it('returns null when data is empty', () => {
    const { toJSON } = render(<Sparkline data={[]} />);

    expect(toJSON()).toBeNull();
  });

  it('renders Canvas when data has 2+ points', () => {
    render(<Sparkline data={[10, 8, 6]} />);

    expect(screen.getByTestId('canvas')).toBeTruthy();
  });
});
