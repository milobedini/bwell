import { fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('@/utils/dates', () => ({
  timeAgo: (d: string) => (d ? { relative: '2 hours ago', formatted: d } : { relative: null, formatted: '' })
}));

const DiaryHeader = require('./DiaryHeader').default;

const defaultProps = {
  updatedAt: '2026-04-10T10:00:00Z',
  disclaimerOpen: false,
  setDisclaimerOpen: jest.fn()
};

describe('DiaryHeader', () => {
  it('renders last saved time with relative format', () => {
    render(<DiaryHeader {...defaultProps} />);

    expect(screen.getByText('Last saved 2 hours ago')).toBeTruthy();
  });

  it('renders patient name when provided', () => {
    render(<DiaryHeader {...defaultProps} patientName="Alice" />);

    expect(screen.getByText('by Alice')).toBeTruthy();
  });

  it('does not render patient name when absent', () => {
    render(<DiaryHeader {...defaultProps} />);

    expect(screen.queryByText(/^by /)).toBeNull();
  });

  it('renders disclaimer toggle when moduleSnapshot has disclaimer', () => {
    render(<DiaryHeader {...defaultProps} moduleSnapshot={{ disclaimer: 'Safety info here' }} />);

    expect(screen.getByLabelText('Safety information')).toBeTruthy();
  });

  it('does not render disclaimer toggle when no disclaimer', () => {
    render(<DiaryHeader {...defaultProps} moduleSnapshot={{ disclaimer: undefined }} />);

    expect(screen.queryByLabelText('Safety information')).toBeNull();
  });

  it('shows disclaimer text when disclaimerOpen is true', () => {
    render(<DiaryHeader {...defaultProps} disclaimerOpen={true} moduleSnapshot={{ disclaimer: 'Safety info here' }} />);

    expect(screen.getByText('Safety info here')).toBeTruthy();
  });

  it('hides disclaimer text when disclaimerOpen is false', () => {
    render(
      <DiaryHeader {...defaultProps} disclaimerOpen={false} moduleSnapshot={{ disclaimer: 'Safety info here' }} />
    );

    expect(screen.queryByText('Safety info here')).toBeNull();
  });

  it('calls setDisclaimerOpen on toggle press', () => {
    const setDisclaimerOpen = jest.fn();
    render(
      <DiaryHeader
        {...defaultProps}
        setDisclaimerOpen={setDisclaimerOpen}
        moduleSnapshot={{ disclaimer: 'Safety info' }}
      />
    );

    fireEvent.press(screen.getByLabelText('Safety information'));
    expect(setDisclaimerOpen).toHaveBeenCalledWith(true);
  });
});
