export const endOfLocalDay = (d: Date) => {
  const out = new Date(d);
  out.setHours(23, 59, 0, 0);
  return out;
};

// Convert a local Date to Mongo-friendly ISO (UTC "Z")
export const toMongoISOString = (d: Date) => new Date(d.getTime()).toISOString();

// Pretty print for the SelectField value
export const formatForField = (d: Date, hasTime: boolean) => {
  try {
    const dateFmt = new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(d);
    if (!hasTime) return dateFmt; // "Sun, 24 Aug 2025"
    const timeFmt = new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
    return `${dateFmt} · ${timeFmt}`; // "Sun, 24 Aug 2025 · 23:59"
  } catch {
    // Fallback if Intl not available
    const pad = (n: number) => String(n).padStart(2, '0');
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return hasTime ? `${y}-${m}-${day} ${hh}:${mm}` : `${y}-${m}-${day}`;
  }
};

export const dateString = (input: string): string => {
  const date = new Date(input);
  return date.toLocaleDateString();
};

type TimeAgoResult = {
  relative: string | null;
  formatted: string;
};

export const timeAgo = (input: string): TimeAgoResult => {
  const date = new Date(input);
  if (isNaN(date.getTime())) return { relative: null, formatted: '' };
  const formatted = dateString(input);
  const diffMs = Date.now() - date.getTime();

  if (diffMs < 60_000) return { relative: 'just now', formatted };

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60)
    return {
      relative: minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`,
      formatted
    };

  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 24)
    return {
      relative: hours === 1 ? '1 hour ago' : `${hours} hours ago`,
      formatted
    };

  const days = Math.floor(diffMs / 86_400_000);
  if (days < 7)
    return {
      relative: days === 1 ? '1 day ago' : `${days} days ago`,
      formatted
    };

  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return {
      relative: weeks === 1 ? '1 week ago' : `${weeks} weeks ago`,
      formatted
    };
  }

  return { relative: null, formatted };
};

type DateSection<T> = {
  title: string;
  data: T[];
};

export const groupByDate = <T extends { completedAt?: string }>(rows: T[]): DateSection<T>[] => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86_400_000);
  const dow = today.getDay() || 7; // Sunday becomes 7 (ISO convention)
  const thisWeekStart = new Date(today.getTime() - (dow - 1) * 86_400_000);
  const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * 86_400_000);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const buckets = new Map<string, T[]>();

  const getKey = (dateStr?: string): string => {
    if (!dateStr) return 'Earlier';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Earlier';

    if (d >= today) return 'Today';
    if (d >= yesterday) return 'Yesterday';
    if (d >= thisWeekStart) return 'This Week';
    if (d >= lastWeekStart) return 'Last Week';
    if (d >= thisMonthStart) return 'This Month';

    // Month name + year for older entries
    return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(d);
  };

  const order = rows.reduce<string[]>((acc, row) => {
    const key = getKey(row.completedAt);
    if (!buckets.has(key)) {
      buckets.set(key, []);
      acc.push(key);
    }
    buckets.get(key)!.push(row);
    return acc;
  }, []);

  return order.map((title) => ({ title, data: buckets.get(title)! }));
};
