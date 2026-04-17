import { Colors } from '@/constants/Colors';
import { render } from '@testing-library/react-native';

import BarSparkline from './BarSparkline';

describe('BarSparkline', () => {
  it('renders the correct number of bars', () => {
    const { toJSON } = render(<BarSparkline values={[1, 2, 3]} />);
    const container = toJSON();
    // Container View has children = the bar Views
    expect(container.children).toHaveLength(3);
  });

  it('slices to barCount when provided', () => {
    const { toJSON } = render(<BarSparkline values={[1, 2, 3, 4, 5]} barCount={3} />);
    const container = toJSON();
    // slice(-3) gives last 3 values
    expect(container.children).toHaveLength(3);
  });

  it('last bar uses bright colour, others use darkGrey', () => {
    const { toJSON } = render(<BarSparkline values={[5, 10, 15]} />);
    const container = toJSON();
    const bars = container.children;

    expect(bars[0].props.style.backgroundColor).toBe(Colors.sway.darkGrey);
    expect(bars[1].props.style.backgroundColor).toBe(Colors.sway.darkGrey);
    expect(bars[2].props.style.backgroundColor).toBe(Colors.sway.bright);
  });

  it('enforces minimum bar height of 3', () => {
    const { toJSON } = render(<BarSparkline values={[0]} maxHeight={24} />);
    const container = toJSON();
    const bar = container.children[0];
    expect(bar.props.style.height).toBe(3);
  });

  it('single bar uses bright colour', () => {
    const { toJSON } = render(<BarSparkline values={[10]} />);
    const container = toJSON();
    expect(container.children[0].props.style.backgroundColor).toBe(Colors.sway.bright);
  });
});
