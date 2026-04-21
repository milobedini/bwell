import type { CareTier, Instrument } from '@milobedini/shared-types';

export const INSTRUMENT_LABEL: Record<Instrument, string> = {
  phq9: 'PHQ-9',
  gad7: 'GAD-7',
  pdss: 'PDSS'
};

export const INSTRUMENT_CUTOFF: Record<Instrument, string> = {
  phq9: 'PHQ-9 ≥ 10',
  gad7: 'GAD-7 ≥ 8',
  pdss: 'PDSS ≥ 8'
};

export const INSTRUMENT_DELTA: Record<Instrument, string | undefined> = {
  phq9: 'Δ ≥ 6 PHQ-9 points',
  gad7: 'Δ ≥ 4 GAD-7 points',
  pdss: undefined
};

export const TIER_LABEL: Record<CareTier, string> = {
  self_help: 'Self-help',
  cbt_guided: 'CBT',
  pwp_guided: 'PWP'
};
