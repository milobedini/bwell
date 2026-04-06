import { clamp } from './helpers';

describe('clamp', () => {
  it('returns the value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('clamps to the lower bound', () => {
    expect(clamp(-3, 0, 10)).toBe(0);
  });

  it('clamps to the upper bound', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('returns lo when value equals lo', () => {
    expect(clamp(0, 0, 10)).toBe(0);
  });

  it('returns hi when value equals hi', () => {
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it('works with negative ranges', () => {
    expect(clamp(-5, -10, -1)).toBe(-5);
    expect(clamp(-15, -10, -1)).toBe(-10);
    expect(clamp(0, -10, -1)).toBe(-1);
  });

  it('works when lo equals hi', () => {
    expect(clamp(5, 3, 3)).toBe(3);
  });
});
