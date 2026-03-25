import { Colors } from '@/constants/Colors';

type SeverityColors = {
  border: string;
  pillBg: string;
  text: string;
};

const SEVERITY_MAP: readonly { pattern: RegExp; border: string; pillBg: string; text: string }[] = [
  { pattern: /severe|high/i, border: Colors.chip.red, pillBg: Colors.tint.error, text: Colors.primary.error },
  { pattern: /moderate/i, border: Colors.chip.amber, pillBg: Colors.tint.info, text: Colors.primary.warning },
  { pattern: /mild|minimal|low/i, border: Colors.chip.green, pillBg: Colors.tint.teal, text: Colors.sway.bright }
];

const DEFAULT_COLORS: SeverityColors = {
  border: Colors.sway.bright,
  pillBg: 'transparent',
  text: Colors.sway.darkGrey
};

export const getSeverityColors = (label?: string | null): SeverityColors => {
  if (!label) return DEFAULT_COLORS;
  const match = SEVERITY_MAP.find((s) => s.pattern.test(label));
  return match ? { border: match.border, pillBg: match.pillBg, text: match.text } : DEFAULT_COLORS;
};
