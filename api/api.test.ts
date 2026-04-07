import { useAuthStore } from '@/stores/authStore';

// Must import AFTER mocks are set up — api.ts runs interceptor setup at import time
// so we use a lazy require inside each test to get a fresh module.

jest.mock('@/stores/authStore', () => ({
  useAuthStore: {
    getState: jest.fn(() => ({ clearUser: jest.fn() }))
  }
}));

// Isolate module per test so interceptors are fresh
const loadApi = () => {
  jest.resetModules();
  // Re-apply store mock after resetModules
  jest.doMock('@/stores/authStore', () => ({
    useAuthStore: {
      getState: jest.fn(() => ({ clearUser: mockClearUser }))
    }
  }));

  return require('./api').api;
};

const mockClearUser = jest.fn();

describe('api module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore.getState as jest.Mock).mockReturnValue({ clearUser: mockClearUser });
  });

  it('creates an axios instance with withCredentials', () => {
    const api = loadApi();
    expect(api.defaults.withCredentials).toBe(true);
  });

  it('sets a baseURL', () => {
    const api = loadApi();
    expect(api.defaults.baseURL).toBeDefined();
    expect(typeof api.defaults.baseURL).toBe('string');
  });

  describe('response interceptor — 401 handling', () => {
    it('calls clearUser on 401 response', async () => {
      const api = loadApi();

      // Grab the error handler from the response interceptor
      // Axios interceptors are stored in the manager
      const errorHandler = api.interceptors.response.handlers[0]?.rejected;
      expect(errorHandler).toBeDefined();

      const error = {
        response: { status: 401 },
        config: { url: '/test' }
      };

      await expect(errorHandler(error)).rejects.toBe(error);
      expect(mockClearUser).toHaveBeenCalled();
    });

    it('does not call clearUser on non-401 errors', async () => {
      const api = loadApi();
      const errorHandler = api.interceptors.response.handlers[0]?.rejected;

      const error = {
        response: { status: 500, data: 'server error' },
        config: { url: '/test' }
      };

      await expect(errorHandler(error)).rejects.toBe(error);
      expect(mockClearUser).not.toHaveBeenCalled();
    });

    it('does not call clearUser on network errors (no response)', async () => {
      const api = loadApi();
      const errorHandler = api.interceptors.response.handlers[0]?.rejected;

      const error = { message: 'Network Error' };

      await expect(errorHandler(error)).rejects.toBe(error);
      expect(mockClearUser).not.toHaveBeenCalled();
    });
  });
});
