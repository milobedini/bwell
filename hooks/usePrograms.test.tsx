import { api } from '@/api/api';
import { createQueryClientWrapper } from '@/test-utils/createQueryClientWrapper';
import type { Program, ProgramWithModules } from '@milobedini/shared-types';
import { renderHook, waitFor } from '@testing-library/react-native';

import { useProgram, usePrograms } from './usePrograms';

jest.mock('@/api/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn()
  }
}));

const mockPrograms: Program[] = [
  {
    _id: 'p1',
    title: 'Depression',
    description: 'CBT for depression',
    modules: ['m1', 'm2'],
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01'
  },
  {
    _id: 'p2',
    title: 'Anxiety',
    description: 'CBT for GAD',
    modules: ['m3'],
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01'
  }
];

const mockProgramWithModules: ProgramWithModules = {
  _id: 'p1',
  title: 'Depression',
  description: 'CBT for depression',
  modules: [],
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01'
};

describe('usePrograms', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches and returns programs', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: { programs: mockPrograms } });

    const { result } = renderHook(() => usePrograms(), { wrapper: createQueryClientWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/programs');
    expect(result.current.data).toEqual(mockPrograms);
  });
});

describe('useProgram', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches a single program by id', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: { program: mockProgramWithModules } });

    const { result } = renderHook(() => useProgram('p1'), { wrapper: createQueryClientWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/programs/p1');
    expect(result.current.data).toEqual(mockProgramWithModules);
  });
});
