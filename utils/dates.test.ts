import { dueLabel, endOfLocalDay, formatShortDate, toMongoISOString } from './dates';

describe('endOfLocalDay', () => {
  it('sets hours to 23:59:00.000', () => {
    const input = new Date(2026, 3, 5, 10, 30, 0);
    const result = endOfLocalDay(input);

    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });

  it('does not mutate the original date', () => {
    const input = new Date(2026, 3, 5, 10, 30, 0);
    endOfLocalDay(input);

    expect(input.getHours()).toBe(10);
  });
});

describe('toMongoISOString', () => {
  it('returns a UTC ISO string ending in Z', () => {
    const input = new Date('2026-04-05T12:00:00Z');
    const result = toMongoISOString(input);

    expect(result).toBe('2026-04-05T12:00:00.000Z');
    expect(result.endsWith('Z')).toBe(true);
  });
});

describe('formatShortDate', () => {
  it('formats as "day month" (en-GB)', () => {
    const result = formatShortDate('2026-03-24T00:00:00Z');

    expect(result).toMatch(/24/);
    expect(result).toMatch(/Mar/);
  });
});

describe('dueLabel', () => {
  const mockNow = (iso: string) => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(iso));
  };

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns "Due today" when due date is today', () => {
    mockNow('2026-04-05T10:00:00Z');
    expect(dueLabel('2026-04-05T12:00:00Z')).toBe('Due today');
  });

  it('returns "Due tomorrow" when due date is tomorrow', () => {
    mockNow('2026-04-05T10:00:00Z');
    expect(dueLabel('2026-04-06T12:00:00Z')).toBe('Due tomorrow');
  });

  it('returns "Due in N days" for near future', () => {
    mockNow('2026-04-05T10:00:00Z');
    expect(dueLabel('2026-04-08T12:00:00Z')).toBe('Due in 3 days');
  });

  it('returns "Was due" for past dates', () => {
    mockNow('2026-04-05T10:00:00Z');
    const result = dueLabel('2026-04-01T12:00:00Z');
    expect(result).toMatch(/^Was due/);
  });
});
