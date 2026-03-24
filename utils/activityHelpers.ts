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

const pad2 = (n: number): string => String(n).padStart(2, '0');

const startOfMonday = (d: Date): Date => {
  const dt = new Date(d);
  const day = dt.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  dt.setHours(0, 0, 0, 0);
  dt.setDate(dt.getDate() + diff);
  return dt;
};

const dayLabel = (d: Date): string => d.toLocaleDateString(undefined, { weekday: 'short' });

const dateISO = (d: Date): string => d.toISOString().slice(0, 10);

const slotLabel = (h: number): string => {
  const end = Math.min(24, h + SLOT_STEP_HOURS);
  return `${pad2(h)}:00–${pad2(end)}:00`;
};

export type SlotKey = string;
export type SlotValue = {
  at: Date;
  label: string;
  activity: string;
  mood?: number;
  achievement?: number;
  closeness?: number;
  enjoyment?: number;
};

// Generate the slot hours as an array to avoid mutable `let` loop
const slotHours = Array.from(
  { length: Math.ceil((SLOT_END_HOUR - SLOT_START_HOUR) / SLOT_STEP_HOURS) },
  (_, i) => SLOT_START_HOUR + i * SLOT_STEP_HOURS
);

const buildDaySlots = (baseIso: string): { key: SlotKey; value: SlotValue }[] => {
  const base = new Date(`${baseIso}T00:00:00.000Z`);
  return slotHours.map((h) => {
    const at = new Date(base);
    at.setUTCHours(h, 0, 0, 0);
    const label = slotLabel(h);
    const key = `${dateISO(at)}|${label}`;
    return { key, value: { at, label, activity: '' } };
  });
};

export const isSlotFilled = (v: SlotValue): boolean =>
  v.activity.trim().length > 0 || v.mood != null || v.achievement != null || v.closeness != null || v.enjoyment != null;

export const FIELD_NAMES = ['Activity', 'Mood', 'Achievement', 'Closeness', 'Enjoyment'] as const;
export const FIELDS_PER_SLOT = FIELD_NAMES.length;

export { buildDaySlots, dateISO, dayLabel, slotLabel, startOfMonday };
