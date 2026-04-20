import type { AttentionScore } from '@/utils/attentionScore';
import { fireEvent, render } from '@testing-library/react-native';

import AttentionBanner from './AttentionBanner';

const baseContributors: AttentionScore['contributors'] = [
  { key: 'verification', tripped: false, label: 'Verification queue', detail: 'Empty' },
  { key: 'stalled', tripped: false, label: 'Stalled attempts', detail: '0 stalled' },
  { key: 'orphaned', tripped: false, label: 'Orphaned assignments', detail: 'None' },
  { key: 'rollup', tripped: false, label: 'Clinical rollup', detail: 'Fresh' }
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
  it('renders the headline and 0 count when all clear', () => {
    const { getByText } = render(<AttentionBanner score={buildScore()} />);
    expect(getByText('All clear')).toBeTruthy();
    expect(getByText('0')).toBeTruthy();
  });

  it('renders the tripped count when amber', () => {
    const score = buildScore({
      band: 'amber',
      trippedCount: 2,
      headline: 'Admin attention needed',
      contributors: [
        { ...baseContributors[0], tripped: true, detail: 'Oldest waiting 10d — over 7d threshold' },
        { ...baseContributors[1] },
        { ...baseContributors[2], tripped: true, detail: '1 assignment' },
        { ...baseContributors[3] }
      ]
    });
    const { getByText } = render(<AttentionBanner score={score} />);
    expect(getByText('Admin attention needed')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
    expect(getByText('2 of 4 checks tripped')).toBeTruthy();
  });

  it('renders a ? marker in the unknown / day-one band', () => {
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
            { ...baseContributors[3], tripped: true, detail: 'Never run' }
          ]
        })}
      />
    );
    expect(getByText('?')).toBeTruthy();
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
        { ...baseContributors[0], tripped: true, detail: 'Oldest waiting 10d — over 7d threshold' },
        baseContributors[1],
        baseContributors[2],
        baseContributors[3]
      ]
    });
    const { getByText } = render(<AttentionBanner score={score} onPressVerification={onPressVerification} />);
    fireEvent.press(getByText('Verification queue'));
    expect(onPressVerification).toHaveBeenCalledTimes(1);
  });

  it('does not invoke onPressVerification when verification is not tripped', () => {
    const onPressVerification = jest.fn();
    const { getByText } = render(<AttentionBanner score={buildScore()} onPressVerification={onPressVerification} />);
    fireEvent.press(getByText('Verification queue'));
    expect(onPressVerification).not.toHaveBeenCalled();
  });
});
