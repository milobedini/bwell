import { Colors } from '@/constants/Colors';

import { filterChipStyle, filterChipTextStyle } from './chipStyles';

describe('filterChipStyle', () => {
  it('returns teal bg and bright border when selected', () => {
    const style = filterChipStyle(true);
    expect(style.backgroundColor).toBe(Colors.tint.teal);
    expect(style.borderColor).toBe(Colors.sway.bright);
    expect(style.borderWidth).toBe(1);
  });

  it('returns dark card bg and alt border when not selected', () => {
    const style = filterChipStyle(false);
    expect(style.backgroundColor).toBe(Colors.chip.darkCard);
    expect(style.borderColor).toBe(Colors.chip.darkCardAlt);
    expect(style.borderWidth).toBe(1);
  });
});

describe('filterChipTextStyle', () => {
  it('returns bright color when selected', () => {
    const style = filterChipTextStyle(true);
    expect(style.color).toBe(Colors.sway.bright);
    expect(style.fontSize).toBe(13);
  });

  it('returns dark grey when not selected', () => {
    const style = filterChipTextStyle(false);
    expect(style.color).toBe(Colors.sway.darkGrey);
    expect(style.fontSize).toBe(13);
  });
});
