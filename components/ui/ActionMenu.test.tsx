import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import type { ActionMenuItem } from './ActionMenu';

jest.mock('moti', () => {
  const { View } = require('react-native');
  return {
    AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
    MotiView: ({ children, ...props }: { children: ReactNode; [key: string]: unknown }) => (
      <View {...props}>{children}</View>
    )
  };
});

const ActionMenu = require('./ActionMenu').default;

const makeAction = (overrides: Partial<ActionMenuItem> = {}): ActionMenuItem => ({
  icon: 'pencil',
  label: 'Edit',
  onPress: jest.fn(),
  ...overrides
});

describe('ActionMenu', () => {
  const onDismiss = jest.fn();

  it('does not render content when visible is false', () => {
    const action = makeAction();
    render(<ActionMenu visible={false} onDismiss={onDismiss} actions={[action]} title="Menu" />);

    expect(screen.queryByText('Menu')).toBeNull();
    expect(screen.queryByText('Edit')).toBeNull();
  });

  it('renders title and subtitle when provided', () => {
    const action = makeAction();
    render(
      <ActionMenu visible={true} onDismiss={onDismiss} actions={[action]} title="Menu Title" subtitle="Menu Subtitle" />
    );

    expect(screen.getByText('Menu Title')).toBeTruthy();
    expect(screen.getByText('Menu Subtitle')).toBeTruthy();
  });

  it('renders all action labels', () => {
    const actions = [
      makeAction({ label: 'Edit' }),
      makeAction({ label: 'Delete', variant: 'destructive' }),
      makeAction({ label: 'Share' })
    ];
    render(<ActionMenu visible={true} onDismiss={onDismiss} actions={actions} />);

    expect(screen.getByText('Edit')).toBeTruthy();
    expect(screen.getByText('Delete')).toBeTruthy();
    expect(screen.getByText('Share')).toBeTruthy();
  });

  it('calls onDismiss and onPress when pressing a non-destructive action', () => {
    const onPress = jest.fn();
    const action = makeAction({ label: 'Edit', onPress });
    render(<ActionMenu visible={true} onDismiss={onDismiss} actions={[action]} />);

    fireEvent.press(screen.getByText('Edit'));

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows confirmation view when pressing a destructive action', () => {
    const action = makeAction({
      label: 'Delete',
      variant: 'destructive',
      confirmTitle: 'Delete this item?'
    });
    render(<ActionMenu visible={true} onDismiss={onDismiss} actions={[action]} />);

    fireEvent.press(screen.getByText('Delete'));

    expect(screen.getByText('Delete this item?')).toBeTruthy();
  });

  it('shows default "Are you sure?" when destructive action has no confirmTitle', () => {
    const action = makeAction({
      label: 'Remove',
      variant: 'destructive'
    });
    render(<ActionMenu visible={true} onDismiss={onDismiss} actions={[action]} />);

    fireEvent.press(screen.getByText('Remove'));

    expect(screen.getByText('Are you sure?')).toBeTruthy();
  });

  it('shows confirmDescription when provided', () => {
    const action = makeAction({
      label: 'Delete',
      variant: 'destructive',
      confirmDescription: 'This action cannot be undone.'
    });
    render(<ActionMenu visible={true} onDismiss={onDismiss} actions={[action]} />);

    fireEvent.press(screen.getByText('Delete'));

    expect(screen.getByText('This action cannot be undone.')).toBeTruthy();
  });

  it('calls onDismiss and onPress when confirming a destructive action', () => {
    const onPress = jest.fn();
    const action = makeAction({
      label: 'Delete',
      variant: 'destructive',
      onPress
    });
    render(<ActionMenu visible={true} onDismiss={onDismiss} actions={[action]} />);

    // Enter confirmation view
    fireEvent.press(screen.getByText('Delete'));
    // The confirm button shows the action label by default
    fireEvent.press(screen.getByText('Delete'));

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('returns to action list when pressing cancel on confirmation', () => {
    const actions = [makeAction({ label: 'Edit' }), makeAction({ label: 'Delete', variant: 'destructive' })];
    render(<ActionMenu visible={true} onDismiss={onDismiss} actions={actions} />);

    // Enter confirmation view
    fireEvent.press(screen.getByText('Delete'));
    expect(screen.queryByText('Edit')).toBeNull();

    // Press Cancel to return
    fireEvent.press(screen.getByText('Cancel'));

    expect(screen.getByText('Edit')).toBeTruthy();
    expect(screen.getByText('Delete')).toBeTruthy();
  });

  it('uses confirmLabel on confirm button when provided, falls back to action label', () => {
    const action = makeAction({
      label: 'Delete',
      variant: 'destructive',
      confirmLabel: 'Yes, delete it'
    });
    render(<ActionMenu visible={true} onDismiss={onDismiss} actions={[action]} />);

    fireEvent.press(screen.getByText('Delete'));

    expect(screen.getByText('Yes, delete it')).toBeTruthy();
  });
});
