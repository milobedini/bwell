import { Colors } from '@/constants/Colors';

import { getSeverityColors } from './severity';

describe('getSeverityColors', () => {
  const DEFAULT = {
    border: Colors.sway.bright,
    pillBg: 'transparent',
    text: Colors.sway.darkGrey
  };

  it('returns default colors for null', () => {
    expect(getSeverityColors(null)).toEqual(DEFAULT);
  });

  it('returns default colors for undefined', () => {
    expect(getSeverityColors(undefined)).toEqual(DEFAULT);
  });

  it('returns default colors for empty string', () => {
    expect(getSeverityColors('')).toEqual(DEFAULT);
  });

  it('returns red/error colors for "severe"', () => {
    expect(getSeverityColors('severe')).toEqual({
      border: Colors.chip.red,
      pillBg: Colors.tint.error,
      text: Colors.primary.error
    });
  });

  it('matches "high" as severe (case-insensitive)', () => {
    expect(getSeverityColors('High')).toEqual({
      border: Colors.chip.red,
      pillBg: Colors.tint.error,
      text: Colors.primary.error
    });
  });

  it('returns amber/warning colors for "moderate"', () => {
    expect(getSeverityColors('moderate')).toEqual({
      border: Colors.chip.amber,
      pillBg: Colors.tint.info,
      text: Colors.primary.warning
    });
  });

  it('matches "Moderate" case-insensitively', () => {
    expect(getSeverityColors('Moderate')).toEqual({
      border: Colors.chip.amber,
      pillBg: Colors.tint.info,
      text: Colors.primary.warning
    });
  });

  it('returns green/teal colors for "mild"', () => {
    expect(getSeverityColors('mild')).toEqual({
      border: Colors.chip.green,
      pillBg: Colors.tint.teal,
      text: Colors.sway.bright
    });
  });

  it('matches "minimal" as mild', () => {
    expect(getSeverityColors('minimal')).toEqual({
      border: Colors.chip.green,
      pillBg: Colors.tint.teal,
      text: Colors.sway.bright
    });
  });

  it('matches "low" as mild', () => {
    expect(getSeverityColors('Low')).toEqual({
      border: Colors.chip.green,
      pillBg: Colors.tint.teal,
      text: Colors.sway.bright
    });
  });

  it('returns default colors for unrecognised label', () => {
    expect(getSeverityColors('unknown-label')).toEqual(DEFAULT);
  });
});
