import { Colors } from '@/constants/Colors';
import { render, screen } from '@testing-library/react-native';

import { ThemedText } from './ThemedText';

describe('ThemedText', () => {
  it('renders children text', () => {
    render(<ThemedText>Hello world</ThemedText>);
    expect(screen.getByText('Hello world')).toBeTruthy();
  });

  it('applies error color for type="error"', () => {
    render(<ThemedText type="error">Something went wrong</ThemedText>);
    const el = screen.getByText('Something went wrong');
    expect(el.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ color: Colors.primary.error })]));
  });

  it('applies dark text color when onLight is true', () => {
    render(<ThemedText onLight>Light mode text</ThemedText>);
    const el = screen.getByText('Light mode text');
    expect(el.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ color: Colors.sway.dark })]));
  });

  it('passes style prop through', () => {
    render(<ThemedText style={{ marginTop: 20 }}>Styled</ThemedText>);
    const el = screen.getByText('Styled');
    expect(el.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ marginTop: 20 })]));
  });
});
