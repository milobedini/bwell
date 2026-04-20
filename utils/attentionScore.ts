import type { AdminOverviewResponse } from '@milobedini/shared-types';

export type AttentionBand = 'green' | 'amber' | 'red' | 'unknown';

export type AttentionContributor = {
  key: 'verification' | 'stalled' | 'orphaned' | 'rollup';
  tripped: boolean;
  label: string;
  detail: string;
};

export type AttentionScore = {
  band: AttentionBand;
  trippedCount: number;
  totalChecks: number;
  headline: string;
  contributors: AttentionContributor[];
};

const DAY_MS = 24 * 60 * 60 * 1000;
const VERIFY_AGE_THRESHOLD_DAYS = 7;
const STALLED_THRESHOLD = 5;
const ROLLUP_STALENESS_MS = 48 * 60 * 60 * 1000;

const ageInDays = (iso: string, now: number): number => Math.floor((now - new Date(iso).getTime()) / DAY_MS);

export const computeAttentionScore = (data: AdminOverviewResponse, now: Date = new Date()): AttentionScore => {
  const nowMs = now.getTime();

  // Verification: oldest unverified therapist older than threshold.
  const oldest = data.verificationQueue.oldest[0];
  const verifyAgeDays = oldest ? ageInDays(oldest.createdAt, nowMs) : 0;
  const verifyTripped = !!oldest && verifyAgeDays > VERIFY_AGE_THRESHOLD_DAYS;
  const verification: AttentionContributor = {
    key: 'verification',
    tripped: verifyTripped,
    label: `Verification queue`,
    detail: oldest
      ? verifyTripped
        ? `Oldest waiting ${verifyAgeDays}d — over ${VERIFY_AGE_THRESHOLD_DAYS}d threshold`
        : `Oldest waiting ${verifyAgeDays}d`
      : 'Empty'
  };

  // Stalled attempts above threshold.
  const stalledCount = data.operational.work.stalledAttempts7d;
  const stalledTripped = stalledCount > STALLED_THRESHOLD;
  const stalled: AttentionContributor = {
    key: 'stalled',
    tripped: stalledTripped,
    label: 'Stalled attempts',
    detail: stalledTripped ? `${stalledCount} stalled — over ${STALLED_THRESHOLD} threshold` : `${stalledCount} stalled`
  };

  // Any orphaned assignments (zero tolerance).
  const orphanedCount = data.operational.work.orphanedAssignments;
  const orphanedTripped = orphanedCount > 0;
  const orphaned: AttentionContributor = {
    key: 'orphaned',
    tripped: orphanedTripped,
    label: 'Orphaned assignments',
    detail: orphanedCount === 0 ? 'None' : `${orphanedCount} assignment${orphanedCount === 1 ? '' : 's'}`
  };

  // Rollup staleness: null or older than threshold.
  const rollupStale = data.rollupAsOf === null || nowMs - new Date(data.rollupAsOf).getTime() > ROLLUP_STALENESS_MS;
  const rollupUnknown = data.rollupAsOf === null;
  const rollup: AttentionContributor = {
    key: 'rollup',
    tripped: rollupStale,
    label: 'Clinical rollup',
    detail: rollupUnknown ? 'Never run' : rollupStale ? 'Over 48h stale' : 'Fresh'
  };

  const contributors: AttentionContributor[] = [verification, stalled, orphaned, rollup];
  const trippedCount = contributors.filter((c) => c.tripped).length;

  // Day-one unknown posture: no rollup ever AND no other signal trips.
  // Admin shouldn't see a false "all clear" before the first rollup runs.
  const isDayOne = rollupUnknown && trippedCount === 1 && rollup.tripped;

  const band: AttentionBand = isDayOne ? 'unknown' : trippedCount === 0 ? 'green' : trippedCount >= 3 ? 'red' : 'amber';

  const headline: string =
    band === 'green'
      ? 'All clear'
      : band === 'unknown'
        ? 'Awaiting first rollup'
        : band === 'red'
          ? 'Escalation — review now'
          : 'Admin attention needed';

  return { band, trippedCount, totalChecks: contributors.length, headline, contributors };
};
