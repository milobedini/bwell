import { getInitials } from './initials';

describe('getInitials', () => {
  it('returns two-letter initials from a two-word name', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  it('returns first letters of first two words for three-word names', () => {
    expect(getInitials('Mary Jane Watson')).toBe('MJ');
  });

  it('returns first two characters of a single-word name', () => {
    expect(getInitials('Alice')).toBe('AL');
  });

  it('uppercases lowercase input', () => {
    expect(getInitials('jane smith')).toBe('JS');
  });

  it('handles extra whitespace between words', () => {
    expect(getInitials('  Bob   Marley  ')).toBe('BM');
  });

  it('handles a single character name', () => {
    expect(getInitials('A')).toBe('A');
  });

  it('handles two-character single-word name', () => {
    expect(getInitials('ab')).toBe('AB');
  });
});
