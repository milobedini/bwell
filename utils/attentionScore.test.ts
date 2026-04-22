import type { AdminOverviewResponse } from '@milobedini/shared-types';

import { computeAttentionScore } from './attentionScore';

const buildOverview = (overrides: Partial<AdminOverviewResponse> = {}): AdminOverviewResponse => ({
  asOf: '2026-04-20T10:00:00.000Z',
  rollupAsOf: '2026-04-20T02:00:00.000Z',
  privacyMode: 'production',
  operational: {
    users: {
      total: 50,
      patients: 30,
      therapists: { total: 20, verified: 18, unverified: 2, zeroPatients: 0 },
      newThisWeek: 3,
      newLastWeek: 2,
      activeLast30d: 25,
      activeLast30dPrevious: 22
    },
    work: {
      completedAttemptsLast7d: 40,
      completedAttemptsPreviousWeek: 38,
      stalledAttempts7d: 0,
      orphanedAssignments: 0,
      byType: []
    },
    audit: { eventsLast7d: 5 }
  },
  programmes: [],
  verificationQueue: { count: 0, oldest: [] },
  ...overrides
});

const now = new Date('2026-04-20T10:00:00.000Z');

describe('computeAttentionScore', () => {
  it('returns green when nothing is tripped and rollup is fresh', () => {
    const s = computeAttentionScore(buildOverview(), now);
    expect(s.band).toBe('green');
    expect(s.trippedCount).toBe(0);
    expect(s.headline).toBe('All clear');
  });

  it('returns amber with 1 tripped contributor (orphaned assignment)', () => {
    const s = computeAttentionScore(
      buildOverview({
        operational: {
          ...buildOverview().operational,
          work: {
            ...buildOverview().operational.work,
            orphanedAssignments: 1
          }
        }
      }),
      now
    );
    expect(s.band).toBe('amber');
    expect(s.trippedCount).toBe(1);
    expect(s.headline).toBe('Admin attention needed');
  });

  it('returns red when 3+ contributors are tripped', () => {
    const s = computeAttentionScore(
      buildOverview({
        rollupAsOf: '2026-04-17T02:00:00.000Z', // > 48h stale
        operational: {
          ...buildOverview().operational,
          work: {
            ...buildOverview().operational.work,
            stalledAttempts7d: 10,
            orphanedAssignments: 2
          }
        }
      }),
      now
    );
    expect(s.band).toBe('red');
    expect(s.trippedCount).toBeGreaterThanOrEqual(3);
    expect(s.headline).toBe('Escalation — review now');
  });

  it('returns unknown on day-one when rollup is null and nothing else is tripped', () => {
    const s = computeAttentionScore(
      buildOverview({
        rollupAsOf: null
      }),
      now
    );
    expect(s.band).toBe('unknown');
    expect(s.headline).toBe('Awaiting first rollup');
    // Rollup contributor trips because it's null, but admin shouldn't see green.
    expect(s.contributors.find((c) => c.key === 'rollup')?.tripped).toBe(true);
  });

  it('trips verification when oldest is over the 7 day threshold', () => {
    const s = computeAttentionScore(
      buildOverview({
        verificationQueue: {
          count: 1,
          oldest: [
            {
              userId: 't1',
              username: 'tnew',
              email: 't@test.bwell',
              createdAt: '2026-04-10T00:00:00.000Z', // 10 days ago
              therapistTier: null
            }
          ]
        }
      }),
      now
    );
    const verif = s.contributors.find((c) => c.key === 'verification');
    expect(verif?.tripped).toBe(true);
    expect(s.band).toBe('amber');
  });

  it('does not trip verification when oldest is within threshold', () => {
    const s = computeAttentionScore(
      buildOverview({
        verificationQueue: {
          count: 1,
          oldest: [
            {
              userId: 't1',
              username: 'tnew',
              email: 't@test.bwell',
              createdAt: '2026-04-18T00:00:00.000Z', // 2 days ago
              therapistTier: null
            }
          ]
        }
      }),
      now
    );
    expect(s.contributors.find((c) => c.key === 'verification')?.tripped).toBe(false);
    expect(s.band).toBe('green');
  });

  it('includes label, value and detail for each contributor', () => {
    const s = computeAttentionScore(buildOverview(), now);
    for (const c of s.contributors) {
      expect(c.label).toBeTruthy();
      expect(c.value).toBeTruthy();
      expect(c.detail).toBeTruthy();
    }
  });

  it('escalates verification CTA copy when tripped, shows a softer one when queue is non-empty but fresh', () => {
    const tripped = computeAttentionScore(
      buildOverview({
        verificationQueue: {
          count: 2,
          oldest: [
            {
              userId: 't1',
              username: 'tnew',
              email: 't@test.bwell',
              createdAt: '2026-04-10T00:00:00.000Z',
              therapistTier: null
            }
          ]
        }
      }),
      now
    );
    expect(tripped.contributors.find((c) => c.key === 'verification')?.ctaLabel).toBe('Resolve verify queue');

    // Queue has therapists waiting but none over the 7-day threshold yet — softer CTA.
    const fresh = computeAttentionScore(
      buildOverview({
        verificationQueue: {
          count: 3,
          oldest: [
            {
              userId: 't1',
              username: 'tnew',
              email: 't@test.bwell',
              createdAt: '2026-04-19T00:00:00.000Z',
              therapistTier: null
            }
          ]
        }
      }),
      now
    );
    expect(fresh.contributors.find((c) => c.key === 'verification')?.ctaLabel).toBe('Verify therapists');

    // Empty queue — no CTA.
    const clear = computeAttentionScore(buildOverview(), now);
    expect(clear.contributors.find((c) => c.key === 'verification')?.ctaLabel).toBeUndefined();
  });

  it('attaches drill-in CTAs to stalled / orphaned only when tripped, and always to rollup', () => {
    const clear = computeAttentionScore(buildOverview(), now);
    expect(clear.contributors.find((c) => c.key === 'stalled')?.ctaLabel).toBeUndefined();
    expect(clear.contributors.find((c) => c.key === 'orphaned')?.ctaLabel).toBeUndefined();
    expect(clear.contributors.find((c) => c.key === 'rollup')?.ctaLabel).toBe('Open system health');

    const tripped = computeAttentionScore(
      buildOverview({
        operational: {
          ...buildOverview().operational,
          work: {
            ...buildOverview().operational.work,
            stalledAttempts7d: 10,
            orphanedAssignments: 2
          }
        }
      }),
      now
    );
    expect(tripped.contributors.find((c) => c.key === 'stalled')?.ctaLabel).toBe('View stalled attempts');
    expect(tripped.contributors.find((c) => c.key === 'orphaned')?.ctaLabel).toBe('View orphaned assignments');
    expect(tripped.contributors.find((c) => c.key === 'rollup')?.ctaLabel).toBe('Open system health');
  });

  it('formats rollup value as relative age when fresh', () => {
    const s = computeAttentionScore(buildOverview(), now);
    const rollup = s.contributors.find((c) => c.key === 'rollup');
    // 10:00 now, rollup at 02:00 same day → 8h ago
    expect(rollup?.value).toBe('8h ago');
  });

  it('reads "added today" when the oldest unverified therapist was created today', () => {
    const s = computeAttentionScore(
      buildOverview({
        verificationQueue: {
          count: 1,
          oldest: [
            {
              userId: 't1',
              username: 'tnew',
              email: 't@test.bwell',
              createdAt: '2026-04-20T09:30:00.000Z', // 30m before now
              therapistTier: null
            }
          ]
        }
      }),
      now
    );
    expect(s.contributors.find((c) => c.key === 'verification')?.detail).toBe('Oldest therapist was added today.');
  });

  it('uses the singular "1 day" copy when the oldest has waited exactly one day', () => {
    const s = computeAttentionScore(
      buildOverview({
        verificationQueue: {
          count: 1,
          oldest: [
            {
              userId: 't1',
              username: 'tnew',
              email: 't@test.bwell',
              createdAt: '2026-04-19T09:30:00.000Z',
              therapistTier: null
            }
          ]
        }
      }),
      now
    );
    expect(s.contributors.find((c) => c.key === 'verification')?.detail).toBe('Oldest therapist has waited 1 day.');
  });

  it('reports "Never run" rollup value when rollupAsOf is null', () => {
    const s = computeAttentionScore(buildOverview({ rollupAsOf: null }), now);
    expect(s.contributors.find((c) => c.key === 'rollup')?.value).toBe('Never run');
  });
});
