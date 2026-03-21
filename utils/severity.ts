import { Colors } from '@/constants/Colors';

type SeverityColors = {
  border: string;
  pillBg: string;
};

const SEVERITY_MAP: readonly { pattern: RegExp; border: string; pillBg: string }[] = [
  { pattern: /severe|high/i, border: Colors.chip.red, pillBg: Colors.tint.error },
  { pattern: /moderate/i, border: Colors.chip.amber, pillBg: Colors.tint.info },
  { pattern: /mild|minimal|low/i, border: Colors.chip.green, pillBg: Colors.tint.teal }
];

const DEFAULT_COLORS: SeverityColors = {
  border: Colors.sway.bright,
  pillBg: 'transparent'
};

export const getSeverityColors = (label?: string | null): SeverityColors => {
  if (!label) return DEFAULT_COLORS;
  const match = SEVERITY_MAP.find((s) => s.pattern.test(label));
  return match ? { border: match.border, pillBg: match.pillBg } : DEFAULT_COLORS;
};
