import { fireEvent, render, screen } from '@testing-library/react-native';

const DiaryFooter = require('./DiaryFooter').default;

const defaultProps = {
  mode: 'edit' as const,
  canEdit: true,
  userNoteText: '',
  setUserNoteText: jest.fn(),
  setNoteDirty: jest.fn(),
  allAnswered: true,
  hasDirtyChanges: false,
  onSaveDraft: jest.fn(),
  onSubmit: jest.fn(),
  onDiscard: jest.fn()
};

describe('DiaryFooter', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── Edit mode ──

  it('renders note input when canEdit is true', () => {
    render(<DiaryFooter {...defaultProps} />);

    expect(screen.getByText('Note to Therapist')).toBeTruthy();
    expect(screen.getByPlaceholderText(/Anything you'd like/)).toBeTruthy();
  });

  it('renders character count', () => {
    render(<DiaryFooter {...defaultProps} userNoteText="Hello" />);

    expect(screen.getByText('5 / 500')).toBeTruthy();
  });

  it('calls setUserNoteText and setNoteDirty on text change', () => {
    const setUserNoteText = jest.fn();
    const setNoteDirty = jest.fn();
    render(<DiaryFooter {...defaultProps} setUserNoteText={setUserNoteText} setNoteDirty={setNoteDirty} />);

    fireEvent.changeText(screen.getByPlaceholderText(/Anything you'd like/), 'New note');
    expect(setUserNoteText).toHaveBeenCalledWith('New note');
    expect(setNoteDirty).toHaveBeenCalledWith(true);
  });

  it('renders "Exit" button when no dirty changes', () => {
    render(<DiaryFooter {...defaultProps} hasDirtyChanges={false} />);

    expect(screen.getByText('Exit')).toBeTruthy();
  });

  it('renders "Save Draft" button when dirty changes exist', () => {
    render(<DiaryFooter {...defaultProps} hasDirtyChanges={true} />);

    expect(screen.getByText('Save Draft')).toBeTruthy();
  });

  it('calls onDiscard when "Exit" pressed (no dirty changes)', () => {
    const onDiscard = jest.fn();
    render(<DiaryFooter {...defaultProps} hasDirtyChanges={false} onDiscard={onDiscard} />);

    fireEvent.press(screen.getByText('Exit'));
    expect(onDiscard).toHaveBeenCalled();
  });

  it('calls onSaveDraft when "Save Draft" pressed', () => {
    const onSaveDraft = jest.fn();
    render(<DiaryFooter {...defaultProps} hasDirtyChanges={true} onSaveDraft={onSaveDraft} />);

    fireEvent.press(screen.getByText('Save Draft'));
    expect(onSaveDraft).toHaveBeenCalled();
  });

  it('renders Submit button', () => {
    render(<DiaryFooter {...defaultProps} />);

    expect(screen.getByText('Submit')).toBeTruthy();
  });

  it('calls onSubmit when Submit pressed', () => {
    const onSubmit = jest.fn();
    render(<DiaryFooter {...defaultProps} onSubmit={onSubmit} />);

    fireEvent.press(screen.getByText('Submit'));
    expect(onSubmit).toHaveBeenCalled();
  });

  // ── View mode ──

  it('renders view mode with Exit button only', () => {
    render(<DiaryFooter {...defaultProps} mode="view" canEdit={false} />);

    expect(screen.getByText('Exit')).toBeTruthy();
    expect(screen.queryByText('Submit')).toBeNull();
    expect(screen.queryByText('Save Draft')).toBeNull();
  });

  it('renders read-only patient note when canEdit is false and userNote exists', () => {
    render(<DiaryFooter {...defaultProps} mode="view" canEdit={false} userNote="Patient's note" />);

    expect(screen.getByText('Patient Note')).toBeTruthy();
    expect(screen.getByText("Patient's note")).toBeTruthy();
  });

  it('hides note section when canEdit is false and no userNote', () => {
    render(<DiaryFooter {...defaultProps} mode="view" canEdit={false} />);

    expect(screen.queryByText('Patient Note')).toBeNull();
    expect(screen.queryByText('Note to Therapist')).toBeNull();
  });
});
