import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import AreaInputModal from './AreaInputModal';

jest.mock('sonner-native', () => ({ toast: { error: jest.fn(), success: jest.fn(), loading: jest.fn() } }));
jest.mock('expo-haptics', () => ({ selectionAsync: jest.fn(), notificationAsync: jest.fn() }));
jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn() }), useLocalSearchParams: () => ({}) }));
jest.mock('@/hooks/useAttempts', () => ({
  useSaveModuleAttempt: () => ({ mutateSilently: jest.fn(), isPending: false }),
  useSubmitAttempt: () => ({ mutate: jest.fn(), isPending: false })
}));
jest.mock('@/components/toast/toastOptions', () => ({ TOAST_DURATIONS: { error: 3000 }, TOAST_STYLES: { error: {} } }));

jest.mock('moti', () => {
  const { View } = require('react-native');
  return {
    AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
    MotiView: ({ children, ...props }: { children: ReactNode }) => <View {...props}>{children}</View>
  };
});

jest.mock('@react-native-vector-icons/material-design-icons', () => {
  const { Text } = require('react-native');
  return { __esModule: true, default: ({ name }: { name: string }) => <Text>{name}</Text> };
});

jest.mock('@/components/ui/KeyboardAvoidingWrapper', () => {
  const { View } = require('react-native');
  return ({ children }: { children: ReactNode }) => <View>{children}</View>;
});

const defaultProps = {
  areaKey: 'thoughts' as const,
  currentStep: 1,
  value: '',
  onChangeText: jest.fn(),
  onNext: jest.fn(),
  onBack: jest.fn(),
  onClose: jest.fn(),
  isSaving: false
};

describe('AreaInputModal', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the area label', () => {
    render(<AreaInputModal {...defaultProps} />);

    expect(screen.getByText('Thoughts')).toBeTruthy();
  });

  it('shows step indicator "N of 6"', () => {
    render(<AreaInputModal {...defaultProps} currentStep={2} />);

    expect(screen.getByText('3 of 6')).toBeTruthy();
  });

  it('shows TextInput with current value', () => {
    render(<AreaInputModal {...defaultProps} value="My thought" />);

    expect(screen.getByDisplayValue('My thought')).toBeTruthy();
  });

  it('calls onBack when Back button pressed', () => {
    const onBack = jest.fn();
    render(<AreaInputModal {...defaultProps} onBack={onBack} />);

    fireEvent.press(screen.getByText('Back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('calls onNext when Next button pressed', () => {
    const onNext = jest.fn();
    render(<AreaInputModal {...defaultProps} value="filled" onNext={onNext} />);

    fireEvent.press(screen.getByText('Next'));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('shows "Review" on last step instead of "Next"', () => {
    render(<AreaInputModal {...defaultProps} areaKey="reflection" currentStep={5} value="done" />);

    expect(screen.getByText('Review')).toBeTruthy();
    expect(screen.queryByText('Next')).toBeNull();
  });

  it('shows "Next" on non-last step', () => {
    render(<AreaInputModal {...defaultProps} currentStep={0} value="filled" />);

    expect(screen.getByText('Next')).toBeTruthy();
    expect(screen.queryByText('Review')).toBeNull();
  });

  it('disables Next button when value is empty', () => {
    render(<AreaInputModal {...defaultProps} value="" />);

    const nextText = screen.getByText('Next');
    let node = nextText.parent;
    while (node && node.props.accessibilityRole !== 'button') {
      node = node.parent;
    }
    expect(node?.props.accessibilityState?.disabled).toBe(true);
  });

  it('disables Next button when value is whitespace only', () => {
    render(<AreaInputModal {...defaultProps} value="   " />);

    const nextText = screen.getByText('Next');
    let node = nextText.parent;
    while (node && node.props.accessibilityRole !== 'button') {
      node = node.parent;
    }
    expect(node?.props.accessibilityState?.disabled).toBe(true);
  });

  it('disables Next button when isSaving', () => {
    render(<AreaInputModal {...defaultProps} value="filled" isSaving />);

    const nextText = screen.getByText('Next');
    let node = nextText.parent;
    while (node && node.props.accessibilityRole !== 'button') {
      node = node.parent;
    }
    expect(node?.props.accessibilityState?.disabled).toBe(true);
  });

  it('enables Next button when value has content and not saving', () => {
    render(<AreaInputModal {...defaultProps} value="filled" isSaving={false} />);

    const nextText = screen.getByText('Next');
    let node = nextText.parent;
    while (node && node.props.accessibilityRole !== 'button') {
      node = node.parent;
    }
    expect(node?.props.accessibilityState?.disabled).toBe(false);
  });

  it('calls onClose when Map button pressed', () => {
    const onClose = jest.fn();
    render(<AreaInputModal {...defaultProps} onClose={onClose} />);

    fireEvent.press(screen.getByText('Map'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onChangeText when typing in TextInput', () => {
    const onChangeText = jest.fn();
    render(<AreaInputModal {...defaultProps} onChangeText={onChangeText} />);

    const input = screen.getByDisplayValue('');
    fireEvent.changeText(input, 'new text');
    expect(onChangeText).toHaveBeenCalledWith('new text');
  });
});
