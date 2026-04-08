import { Colors } from '@/constants/Colors';
import { SLOT_END_HOUR, SLOT_START_HOUR, SLOT_STEP_HOURS } from '@milobedini/shared-types';

import type { SlotValue } from './activityHelpers';
import {
  buildDaySlots,
  dateISO,
  dayLabel,
  FIELD_NAMES,
  FIELDS_PER_SLOT,
  isSlotComplete,
  isSlotFilled,
  moodColor,
  slotLabel,
  startOfMonday
} from './activityHelpers';

describe('moodColor', () => {
  it('returns warm color for mood >= 60', () => {
    expect(moodColor(60)).toBe(Colors.diary.moodWarm);
    expect(moodColor(100)).toBe(Colors.diary.moodWarm);
  });

  it('returns cool color for mood <= 40', () => {
    expect(moodColor(40)).toBe(Colors.diary.moodCool);
    expect(moodColor(0)).toBe(Colors.diary.moodCool);
  });

  it('returns undefined for mid-range mood', () => {
    expect(moodColor(50)).toBeUndefined();
  });

  it('returns undefined for null/undefined', () => {
    expect(moodColor(undefined)).toBeUndefined();
    expect(moodColor(null as unknown as undefined)).toBeUndefined();
  });
});

describe('startOfMonday', () => {
  it('returns Monday for a Wednesday input', () => {
    const wed = new Date('2026-04-01T15:30:00'); // Wednesday
    const result = startOfMonday(wed);
    expect(result.getDay()).toBe(1); // Monday
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
  });

  it('returns same Monday for a Monday input', () => {
    const mon = new Date('2026-03-30T10:00:00'); // Monday
    const result = startOfMonday(mon);
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(30);
  });

  it('returns previous Monday for a Sunday input', () => {
    const sun = new Date('2026-04-05T10:00:00'); // Sunday
    const result = startOfMonday(sun);
    expect(result.getDay()).toBe(1);
    // Sunday April 5 -> Monday March 30
    expect(result.getDate()).toBe(30);
  });

  it('does not mutate the original date', () => {
    const original = new Date('2026-04-01T15:30:00');
    const origTime = original.getTime();
    startOfMonday(original);
    expect(original.getTime()).toBe(origTime);
  });
});

describe('dayLabel', () => {
  it('returns a short weekday string', () => {
    const mon = new Date('2026-03-30T00:00:00');
    const label = dayLabel(mon);
    expect(label).toMatch(/Mon/);
  });
});

describe('dateISO', () => {
  it('returns YYYY-MM-DD format', () => {
    const d = new Date('2026-04-05T12:00:00Z');
    expect(dateISO(d)).toBe('2026-04-05');
  });
});

describe('slotLabel', () => {
  it('formats a time range with padded hours', () => {
    expect(slotLabel(6)).toBe(`06:00–${String(6 + SLOT_STEP_HOURS).padStart(2, '0')}:00`);
  });

  it('caps end at 24:00', () => {
    // Use a large hour that would exceed 24 with step
    const hour = SLOT_END_HOUR - SLOT_STEP_HOURS;
    const label = slotLabel(hour);
    const endHour = Math.min(24, hour + SLOT_STEP_HOURS);
    expect(label).toBe(`${String(hour).padStart(2, '0')}:00–${String(endHour).padStart(2, '0')}:00`);
  });
});

describe('buildDaySlots', () => {
  it('returns expected number of slots', () => {
    const expectedCount = Math.ceil((SLOT_END_HOUR - SLOT_START_HOUR) / SLOT_STEP_HOURS);
    const slots = buildDaySlots('2026-04-05');
    expect(slots).toHaveLength(expectedCount);
  });

  it('each slot has key and value with correct shape', () => {
    const slots = buildDaySlots('2026-04-05');
    const first = slots[0];
    expect(first.key).toContain('|');
    expect(first.value).toHaveProperty('at');
    expect(first.value).toHaveProperty('label');
    expect(first.value.activity).toBe('');
  });
});

describe('isSlotFilled', () => {
  const emptySlot: SlotValue = { at: new Date(), label: '', activity: '' };

  it('returns false for empty slot', () => {
    expect(isSlotFilled(emptySlot)).toBe(false);
  });

  it('returns true when activity has text', () => {
    expect(isSlotFilled({ ...emptySlot, activity: 'Reading' })).toBe(true);
  });

  it('returns true when mood is set', () => {
    expect(isSlotFilled({ ...emptySlot, mood: 50 })).toBe(true);
  });

  it('returns true when achievement is set', () => {
    expect(isSlotFilled({ ...emptySlot, achievement: 3 })).toBe(true);
  });

  it('returns true when closeness is set', () => {
    expect(isSlotFilled({ ...emptySlot, closeness: 7 })).toBe(true);
  });

  it('returns true when enjoyment is set', () => {
    expect(isSlotFilled({ ...emptySlot, enjoyment: 5 })).toBe(true);
  });

  it('returns false when activity is whitespace only', () => {
    expect(isSlotFilled({ ...emptySlot, activity: '   ' })).toBe(false);
  });
});

describe('isSlotComplete', () => {
  const emptySlot: SlotValue = { at: new Date('2025-01-06T06:00:00Z'), label: '06:00–08:00', activity: '' };

  it('returns false for empty slot', () => {
    expect(isSlotComplete(emptySlot)).toBe(false);
  });

  it('returns false when only activity is filled', () => {
    expect(isSlotComplete({ ...emptySlot, activity: 'Walking' })).toBe(false);
  });

  it('returns false when mood is missing', () => {
    expect(isSlotComplete({ ...emptySlot, activity: 'Walking', achievement: 5, closeness: 5, enjoyment: 5 })).toBe(
      false
    );
  });

  it('returns false when one stepper is missing', () => {
    expect(isSlotComplete({ ...emptySlot, activity: 'Walking', mood: 50, achievement: 5, closeness: 5 })).toBe(false);
  });

  it('returns true when all fields are filled', () => {
    expect(
      isSlotComplete({ ...emptySlot, activity: 'Walking', mood: 50, achievement: 5, closeness: 5, enjoyment: 5 })
    ).toBe(true);
  });

  it('returns false when activity is only whitespace', () => {
    expect(
      isSlotComplete({ ...emptySlot, activity: '   ', mood: 50, achievement: 5, closeness: 5, enjoyment: 5 })
    ).toBe(false);
  });

  it('returns true when mood is 0 (explicitly set)', () => {
    expect(
      isSlotComplete({ ...emptySlot, activity: 'Resting', mood: 0, achievement: 0, closeness: 0, enjoyment: 0 })
    ).toBe(true);
  });
});

describe('constants', () => {
  it('FIELD_NAMES has 5 entries', () => {
    expect(FIELD_NAMES).toHaveLength(5);
  });

  it('FIELDS_PER_SLOT equals FIELD_NAMES length', () => {
    expect(FIELDS_PER_SLOT).toBe(FIELD_NAMES.length);
  });
});
