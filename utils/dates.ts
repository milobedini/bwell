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

/** Short date format: "24 Mar" */
export const formatShortDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

/** Compact relative time for dashboard cards (e.g. "2h ago", "3d ago") */
export const formatRelativeTime = (isoDate: string): string => {
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatShortDate(isoDate);
};

export type DateSection<T> = {
  title: string;
  data: T[];
};

const FIXED_DATE_KEYS = ['Today', 'Yesterday', 'This Week', 'Last Week', 'This Month'] as const;

export const groupByDate = <T>(
  rows: T[],
  getDate: (row: T) => string | undefined = (row: T) => (row as { completedAt?: string }).completedAt
): DateSection<T>[] => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86_400_000);
  const dow = today.getDay() || 7;
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

    return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(d);
  };

  const monthKeyDates = new Map<string, Date>();

  for (const row of rows) {
    const dateStr = getDate(row);
    const key = getKey(dateStr);
    if (!buckets.has(key)) {
      buckets.set(key, []);
      if (!(FIXED_DATE_KEYS as readonly string[]).includes(key) && key !== 'Earlier' && dateStr) {
        monthKeyDates.set(key, new Date(dateStr));
      }
    }
    buckets.get(key)!.push(row);
  }

  const sortedMonthKeys = Array.from(monthKeyDates.entries())
    .sort((a, b) => b[1].getTime() - a[1].getTime())
    .map(([key]) => key);

  const sections: DateSection<T>[] = [];
  for (const key of FIXED_DATE_KEYS) {
    const data = buckets.get(key);
    if (data?.length) sections.push({ title: key, data });
  }
  for (const key of sortedMonthKeys) {
    const data = buckets.get(key);
    if (data?.length) sections.push({ title: key, data });
  }
  const earlier = buckets.get('Earlier');
  if (earlier?.length) sections.push({ title: 'Earlier', data: earlier });

  return sections;
};

/** Time-based greeting: "Good morning", "Good afternoon", or "Good evening". */
export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

/** Returns the Monday 00:00 of the current week as an ISO string. */
export const getWeekStart = (): string => {
  const now = new Date();
  const day = now.getDay() || 7; // Sunday → 7
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (day - 1));
  return monday.toISOString();
};

/** Human-friendly due date label relative to today. */
export const dueLabel = (dueAt: string): string => {
  const due = new Date(dueAt);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffDays = Math.round((dueDay.getTime() - today.getTime()) / 86_400_000);

  if (diffDays < 0) return `Was due ${formatShortDate(dueAt)}`;
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  if (diffDays <= 7) return `Due in ${diffDays} days`;
  return `Due ${formatShortDate(dueAt)}`;
};
