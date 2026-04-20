import type { AttemptDetailResponseItem } from '@milobedini/shared-types';
import { render, screen } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn() })
}));

jest.mock('./diary/ActivityDiaryPresenter', () => {
  const { Text } = require('react-native');
  return { __esModule: true, default: () => <Text>DiaryPresenter</Text> };
});

jest.mock('./five-areas/FiveAreasPresenter', () => {
  const { Text } = require('react-native');
  return { __esModule: true, default: () => <Text>FiveAreasPresenter</Text> };
});

jest.mock('./general-goals/GeneralGoalsPresenter', () => {
  const { Text } = require('react-native');
  return { __esModule: true, default: () => <Text>GeneralGoalsPresenter</Text> };
});

jest.mock('./questionnaires/QuestionnairePresenter', () => {
  const { Text } = require('react-native');
  return { __esModule: true, default: () => <Text>QuestionnairePresenter</Text> };
});

jest.mock('./reading/ReadingPresenter', () => {
  const { Text } = require('react-native');
  return { __esModule: true, default: () => <Text>ReadingPresenter</Text> };
});

jest.mock('./weekly-goals/WeeklyGoalsPresenter', () => {
  const { Text } = require('react-native');
  return { __esModule: true, default: () => <Text>WeeklyGoalsPresenter</Text> };
});

const AttemptPresenter = require('./AttemptPresenter').default;

const makeAttempt = (overrides: Partial<AttemptDetailResponseItem> = {}): AttemptDetailResponseItem =>
  ({
    _id: 'att-1',
    moduleType: 'questionnaire',
    status: 'submitted',
    ...overrides
  }) as AttemptDetailResponseItem;

describe('AttemptPresenter', () => {
  it('renders QuestionnairePresenter for questionnaire attempts', () => {
    const attempt = makeAttempt({ moduleType: 'questionnaire', detail: { answers: [], totalScore: 10 } as never });
    render(<AttemptPresenter attempt={attempt} mode="view" />);

    expect(screen.getByText('QuestionnairePresenter')).toBeTruthy();
  });

  it('renders ActivityDiaryPresenter for diary attempts', () => {
    const attempt = makeAttempt({ moduleType: 'activity_diary', diary: { days: [] } as never });
    render(<AttemptPresenter attempt={attempt} mode="view" />);

    expect(screen.getByText('DiaryPresenter')).toBeTruthy();
  });

  it('renders ReadingPresenter for reading attempts', () => {
    const attempt = makeAttempt({ moduleType: 'reading', moduleSnapshot: { title: 'Test' } as never });
    render(<AttemptPresenter attempt={attempt} mode="view" />);

    expect(screen.getByText('ReadingPresenter')).toBeTruthy();
  });

  it('renders FiveAreasPresenter for five_areas_model attempts', () => {
    const attempt = makeAttempt({ moduleType: 'five_areas_model' });
    render(<AttemptPresenter attempt={attempt} mode="view" />);

    expect(screen.getByText('FiveAreasPresenter')).toBeTruthy();
  });

  it('renders GeneralGoalsPresenter for general_goals attempts', () => {
    const attempt = makeAttempt({ moduleType: 'general_goals', generalGoals: { goals: [] } as never });
    render(<AttemptPresenter attempt={attempt} mode="view" />);

    expect(screen.getByText('GeneralGoalsPresenter')).toBeTruthy();
  });

  it('renders WeeklyGoalsPresenter for weekly_goals attempts', () => {
    const attempt = makeAttempt({ moduleType: 'weekly_goals', weeklyGoals: { goals: [] } as never });
    render(<AttemptPresenter attempt={attempt} mode="view" />);

    expect(screen.getByText('WeeklyGoalsPresenter')).toBeTruthy();
  });

  it('renders fallback empty state for unknown module types', () => {
    const attempt = makeAttempt({ moduleType: 'unknown_type' as never });
    render(<AttemptPresenter attempt={attempt} mode="view" />);

    expect(screen.getByText('Not available yet')).toBeTruthy();
    expect(screen.getByText('Go back')).toBeTruthy();
  });
});
