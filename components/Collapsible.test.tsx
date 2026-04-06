import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { Collapsible } from './Collapsible';

jest.mock('@/components/ui/IconSymbol', () => ({
  IconSymbol: 'IconSymbol'
}));

describe('Collapsible', () => {
  it('renders the title', () => {
    render(<Collapsible title="Section A">Content here</Collapsible>);
    expect(screen.getByText('Section A')).toBeTruthy();
  });

  it('hides children by default', () => {
    render(
      <Collapsible title="Section A">
        <Text>Hidden content</Text>
      </Collapsible>
    );
    expect(screen.queryByText('Hidden content')).toBeNull();
  });

  it('shows children after pressing the header', () => {
    render(
      <Collapsible title="Section A">
        <Text>Hidden content</Text>
      </Collapsible>
    );
    fireEvent.press(screen.getByText('Section A'));
    expect(screen.getByText('Hidden content')).toBeTruthy();
  });

  it('hides children again on second press', () => {
    render(
      <Collapsible title="Section A">
        <Text>Hidden content</Text>
      </Collapsible>
    );
    fireEvent.press(screen.getByText('Section A'));
    fireEvent.press(screen.getByText('Section A'));
    expect(screen.queryByText('Hidden content')).toBeNull();
  });
});
