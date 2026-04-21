import type { AttentionScore } from '@/utils/attentionScore';
import { fireEvent, render } from '@testing-library/react-native';

import AttentionBanner from './AttentionBanner';

const baseContributors: AttentionScore['contributors'] = [
  {
    key: 'verification',
    tripped: false,
    label: 'Verification backlog',
    value: 'Empty',
    detail: 'No therapists waiting to be verified.'
  },
  { key: 'stalled', tripped: false, label: 'Stalled patient work', value: '0 stalled', detail: 'Attempts started.' },
  { key: 'orphaned', tripped: false, label: 'Orphaned assignments', value: 'None', detail: 'Every assignment held.' },
  {
    key: 'rollup',
    tripped: false,
    label: 'Clinical rollup',
    value: '14m ago',
    detail: 'Nightly aggregates are current.'
  }
];

const buildScore = (overrides: Partial<AttentionScore> = {}): AttentionScore => ({
  band: 'green',
  trippedCount: 0,
  totalChecks: 4,
  headline: 'All clear',
  contributors: baseContributors,
  ...overrides
});

describe('AttentionBanner', () => {
  it('renders the headline and a 0 ring when all clear', () => {
    const { getByText } = render(<AttentionBanner score={buildScore()} />);
    expect(getByText('All clear')).toBeTruthy();
    expect(getByText('0')).toBeTruthy();
    expect(getByText('of 4 checks')).toBeTruthy();
  });

  it('renders the tripped count and sub line when amber', () => {
    const score = buildScore({
      band: 'amber',
      trippedCount: 2,
      headline: 'Admin attention needed',
      contributors: [
        {
          ...baseContributors[0],
          tripped: true,
          value: '5 waiting',
          detail: 'Oldest therapist has waited 9 days to be verified.',
          ctaLabel: 'Resolve verify queue →'
        },
        { ...baseContributors[1] },
        { ...baseContributors[2], tripped: true, value: '1 assignment', detail: 'An assignment is held.' },
        { ...baseContributors[3] }
      ]
    });
    const { getByText } = render(<AttentionBanner score={score} />);
    expect(getByText('Admin attention needed')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
    expect(getByText('2 of 4 checks tripped')).toBeTruthy();
    expect(getByText('5 waiting')).toBeTruthy();
    expect(getByText('Resolve verify queue →')).toBeTruthy();
  });

  it('renders a ? marker and awaiting-data label in the unknown band', () => {
    const { getByText } = render(
      <AttentionBanner
        score={buildScore({
          band: 'unknown',
          trippedCount: 1,
          headline: 'Awaiting first rollup',
          contributors: [
            baseContributors[0],
            baseContributors[1],
            baseContributors[2],
            { ...baseContributors[3], tripped: true, value: 'Never run', detail: 'The nightly rollup has not run.' }
          ]
        })}
      />
    );
    expect(getByText('?')).toBeTruthy();
    expect(getByText('awaiting data')).toBeTruthy();
    expect(getByText('Awaiting first rollup')).toBeTruthy();
    expect(getByText('The nightly rollup has not completed yet')).toBeTruthy();
  });

  it('invokes onPressVerification when a tripped verification row is tapped', () => {
    const onPressVerification = jest.fn();
    const score = buildScore({
      band: 'amber',
      trippedCount: 1,
      headline: 'Admin attention needed',
      contributors: [
        {
          ...baseContributors[0],
          tripped: true,
          value: '3 waiting',
          detail: 'Oldest therapist has waited 10 days to be verified.',
          ctaLabel: 'Resolve verify queue →'
        },
        baseContributors[1],
        baseContributors[2],
        baseContributors[3]
      ]
    });
    const { getByText } = render(<AttentionBanner score={score} onPressVerification={onPressVerification} />);
    fireEvent.press(getByText('Verification backlog'));
    expect(onPressVerification).toHaveBeenCalledTimes(1);
  });

  it('does not invoke onPressVerification when verification is not tripped', () => {
    const onPressVerification = jest.fn();
    const { getByText } = render(<AttentionBanner score={buildScore()} onPressVerification={onPressVerification} />);
    fireEvent.press(getByText('Verification backlog'));
    expect(onPressVerification).not.toHaveBeenCalled();
  });
});
