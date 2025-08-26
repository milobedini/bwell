import { SLOT_END_HOUR, SLOT_START_HOUR, SLOT_STEP_HOURS } from '@milobedini/shared-types';

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

export { buildDaySlots, dateISO, dayLabel, type SlotKey, slotLabel, type SlotValue, startOfMonday };
