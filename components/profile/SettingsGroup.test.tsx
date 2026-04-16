import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';

const SettingsGroup = require('./SettingsGroup').default;

describe('SettingsGroup', () => {
  it('renders title when provided', () => {
    render(
      <SettingsGroup title="Account">
        <Text>Row 1</Text>
      </SettingsGroup>
    );

    expect(screen.getByText('Account')).toBeTruthy();
    expect(screen.getByText('Row 1')).toBeTruthy();
  });

  it('renders without title', () => {
    render(
      <SettingsGroup>
        <Text>Row 1</Text>
      </SettingsGroup>
    );

    expect(screen.getByText('Row 1')).toBeTruthy();
  });

  it('renders multiple children', () => {
    render(
      <SettingsGroup title="Settings">
        <Text>Row 1</Text>
        <Text>Row 2</Text>
        <Text>Row 3</Text>
      </SettingsGroup>
    );

    expect(screen.getByText('Row 1')).toBeTruthy();
    expect(screen.getByText('Row 2')).toBeTruthy();
    expect(screen.getByText('Row 3')).toBeTruthy();
  });

  it('filters out null children', () => {
    render(
      <SettingsGroup title="Settings">
        <Text>Row 1</Text>
        {null}
        <Text>Row 3</Text>
      </SettingsGroup>
    );

    expect(screen.getByText('Row 1')).toBeTruthy();
    expect(screen.getByText('Row 3')).toBeTruthy();
  });
});
