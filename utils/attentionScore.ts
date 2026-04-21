import type { AdminOverviewResponse } from '@milobedini/shared-types';

export type AttentionBand = 'green' | 'amber' | 'red' | 'unknown';

export type AttentionContributorKey = 'verification' | 'stalled' | 'orphaned' | 'rollup';

export type AttentionContributor = {
  key: AttentionContributorKey;
  tripped: boolean;
  label: string;
  // Short numeric / status chip shown on the right of the row (e.g. "5 waiting", "Empty").
  value: string;
  // Longer sentence describing the contributor's current state.
  detail: string;
  // Optional call-to-action text rendered under the detail when the row has a destination.
  ctaLabel?: string;
};

export type AttentionScore = {
  band: AttentionBand;
  trippedCount: number;
  totalChecks: number;
  headline: string;
  contributors: AttentionContributor[];
};

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const VERIFY_AGE_THRESHOLD_DAYS = 7;
const STALLED_THRESHOLD = 5;
const ROLLUP_STALENESS_MS = 48 * HOUR_MS;

const ageInDays = (iso: string, now: number): number => Math.floor((now - new Date(iso).getTime()) / DAY_MS);

const formatRelativeAge = (iso: string, now: number): string => {
  const diff = now - new Date(iso).getTime();
  if (diff < HOUR_MS) return `${Math.max(1, Math.floor(diff / MINUTE_MS))}m ago`;
  if (diff < DAY_MS) return `${Math.floor(diff / HOUR_MS)}h ago`;
  return `${Math.floor(diff / DAY_MS)}d ago`;
};

export const computeAttentionScore = (data: AdminOverviewResponse, now: Date = new Date()): AttentionScore => {
  const nowMs = now.getTime();

  // Verification: oldest unverified therapist older than threshold.
  const oldest = data.verificationQueue.oldest[0];
  const verifyAgeDays = oldest ? ageInDays(oldest.createdAt, nowMs) : 0;
  const verifyTripped = !!oldest && verifyAgeDays > VERIFY_AGE_THRESHOLD_DAYS;
  const queueCount = data.verificationQueue.count;
  const verification: AttentionContributor = {
    key: 'verification',
    tripped: verifyTripped,
    label: 'Verification backlog',
    value: oldest ? `${queueCount} waiting` : 'Empty',
    detail: oldest
      ? verifyTripped
        ? `Oldest therapist has waited ${verifyAgeDays} days to be verified.`
        : `Oldest therapist has waited ${verifyAgeDays} days.`
      : 'No therapists waiting to be verified.',
    ctaLabel: verifyTripped ? 'Resolve verify queue →' : undefined
  };

  // Stalled attempts above threshold.
  const stalledCount = data.operational.work.stalledAttempts7d;
  const stalledTripped = stalledCount > STALLED_THRESHOLD;
  const stalled: AttentionContributor = {
    key: 'stalled',
    tripped: stalledTripped,
    label: 'Stalled patient work',
    value: `${stalledCount} stalled`,
    detail: stalledTripped
      ? `${stalledCount} attempts untouched for 7+ days — over ${STALLED_THRESHOLD} threshold.`
      : 'Attempts started but not touched for 7+ days.'
  };

  // Any orphaned assignments (zero tolerance).
  const orphanedCount = data.operational.work.orphanedAssignments;
  const orphanedTripped = orphanedCount > 0;
  const orphaned: AttentionContributor = {
    key: 'orphaned',
    tripped: orphanedTripped,
    label: 'Orphaned assignments',
    value: orphanedCount === 0 ? 'None' : `${orphanedCount} assignment${orphanedCount === 1 ? '' : 's'}`,
    detail:
      orphanedCount === 0
        ? 'Every assignment is held by a verified therapist.'
        : 'An assignment is held by a therapist who is no longer verified.'
  };

  // Rollup staleness: null or older than threshold.
  const rollupStale = data.rollupAsOf === null || nowMs - new Date(data.rollupAsOf).getTime() > ROLLUP_STALENESS_MS;
  const rollupUnknown = data.rollupAsOf === null;
  const rollup: AttentionContributor = {
    key: 'rollup',
    tripped: rollupStale,
    label: 'Clinical rollup',
    value: rollupUnknown ? 'Never run' : formatRelativeAge(data.rollupAsOf!, nowMs),
    detail: rollupUnknown
      ? 'The nightly rollup has not completed yet.'
      : rollupStale
        ? 'Nightly aggregates are more than 48 hours old.'
        : 'Nightly aggregates are current.'
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
