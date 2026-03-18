import { Colors } from '@/constants/Colors';
import { SLOT_END_HOUR, SLOT_START_HOUR, SLOT_STEP_HOURS } from '@milobedini/shared-types';

export const REFLECTION_PROMPTS = [
  'Try to notice which activities lifted your mood — even small things count.',
  "Rate achievement based on effort, not outcome — doing something difficult counts even if it didn't go perfectly.",
  'Closeness includes any feeling of connection — a text, a smile from a stranger, time with a pet.',
  'There are no wrong answers. Just record what you actually did and how it felt.',
  "If you can't remember exactly, your best guess is good enough.",
  "Notice if certain times of day tend to feel better or worse — that's useful information.",
  'Enjoyment can be subtle — a warm drink, a song you like, a moment of quiet.',
  "It's okay to leave slots blank if you were asleep or can't recall. Fill in what you can."
] as const;

export const moodColor = (mood?: number): string | undefined => {
  if (mood == null) return undefined;
  if (mood >= 60) return Colors.diary.moodWarm;
  if (mood <= 40) return Colors.diary.moodCool;
  return undefined;
};

const pad2 = (n: number) => String(n).padStart(2, '0');

function startOfMonday(d: Date) {
  const dt = new Date(d);
  const day = dt.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  dt.setHours(0, 0, 0, 0);
  dt.setDate(dt.getDate() + diff);
  return dt;
}
function dayLabel(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: 'short' });
}
function dateISO(d: Date) {
  return d.toISOString().slice(0, 10);
}
function slotLabel(h: number) {
  const end = Math.min(24, h + SLOT_STEP_HOURS);
  return `${pad2(h)}:00–${pad2(end)}:00`;
}

type SlotKey = string;
type SlotValue = {
  at: Date;
  label: string;
  activity: string;
  mood?: number;
  achievement?: number;
  closeness?: number;
  enjoyment?: number;
};
function buildDaySlots(baseIso: string): { key: SlotKey; value: SlotValue }[] {
  const base = new Date(`${baseIso}T00:00:00.000Z`);
  const rows: { key: SlotKey; value: SlotValue }[] = [];
  for (let h = SLOT_START_HOUR; h < SLOT_END_HOUR; h += SLOT_STEP_HOURS) {
    const at = new Date(base);
    at.setUTCHours(h, 0, 0, 0);
    const label = slotLabel(h);
    const key = `${dateISO(at)}|${label}`;
    rows.push({ key, value: { at, label, activity: '' } });
  }
  return rows;
}

export const isSlotFilled = (v: SlotValue): boolean =>
  (v.activity && v.activity.trim().length > 0) ||
  v.mood != null ||
  v.achievement != null ||
  v.closeness != null ||
  v.enjoyment != null;

export { buildDaySlots, dateISO, dayLabel, type SlotKey, slotLabel, type SlotValue, startOfMonday };
