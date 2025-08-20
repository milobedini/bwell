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

export const dateString = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};
