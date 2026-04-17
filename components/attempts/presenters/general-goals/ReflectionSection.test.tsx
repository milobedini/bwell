import { fireEvent, render, screen } from '@testing-library/react-native';

import ReflectionSection from './ReflectionSection';

describe('ReflectionSection', () => {
  // ── Edit mode (first attempt) ──

  it('renders first-attempt prompts in edit mode', () => {
    render(<ReflectionSection reflection="" isReRating={false} canEdit onReflectionChange={jest.fn()} />);

    expect(screen.getByText('Reflection')).toBeTruthy();
    expect(screen.getByText('Consider these questions:')).toBeTruthy();
    expect(screen.getByText('Are these goals in line with your values and what is important to you?')).toBeTruthy();
    expect(
      screen.getByText('Are your goals achievable or do you need to add some steps to get to the final outcome?')
    ).toBeTruthy();
    expect(screen.getByText('Are these goals relevant to improving your mood?')).toBeTruthy();
  });

  it('renders text input in edit mode', () => {
    render(<ReflectionSection reflection="" isReRating={false} canEdit onReflectionChange={jest.fn()} />);

    expect(screen.getByPlaceholderText('Write your reflection...')).toBeTruthy();
  });

  it('calls onReflectionChange when text changes', () => {
    const onChange = jest.fn();
    render(<ReflectionSection reflection="" isReRating={false} canEdit onReflectionChange={onChange} />);

    fireEvent.changeText(screen.getByPlaceholderText('Write your reflection...'), 'New text');
    expect(onChange).toHaveBeenCalledWith('New text');
  });

  // ── Edit mode (re-rating) ──

  it('renders re-rating prompt in edit mode', () => {
    render(<ReflectionSection reflection="" isReRating canEdit onReflectionChange={jest.fn()} />);

    expect(screen.getByText('Consider:')).toBeTruthy();
    expect(screen.getByText('How do you feel about your progress towards these goals?')).toBeTruthy();
    // Should NOT show first-attempt prompts
    expect(screen.queryByText('Are these goals in line with your values and what is important to you?')).toBeNull();
  });

  // ── View mode ──

  it('renders reflection text in view mode', () => {
    render(<ReflectionSection reflection="I feel better" isReRating={false} canEdit={false} />);

    expect(screen.getByText('I feel better')).toBeTruthy();
    // No prompts shown
    expect(screen.queryByText('Consider these questions:')).toBeNull();
    // No text input
    expect(screen.queryByPlaceholderText('Write your reflection...')).toBeNull();
  });

  it('renders nothing for empty reflection in view mode', () => {
    render(<ReflectionSection reflection="" isReRating={false} canEdit={false} />);

    // Should still render the heading but no reflection content view
    expect(screen.getByText('Reflection')).toBeTruthy();
    expect(screen.queryByPlaceholderText('Write your reflection...')).toBeNull();
  });
});
