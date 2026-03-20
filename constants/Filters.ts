export type DrawerStatusOption = 'submitted' | 'active' | 'started' | 'abandoned' | 'all';

export type AttemptFilterDrawerValues = {
  status?: DrawerStatusOption[];
  moduleId?: string;
  limit?: number;
};

export const DEFAULT_FILTERS: AttemptFilterDrawerValues = {
  status: ['submitted'],
  limit: 20,
  moduleId: undefined
};

// Small helper to guarantee presence of defaults
export const withDefaults = (v?: AttemptFilterDrawerValues): AttemptFilterDrawerValues => ({
  ...DEFAULT_FILTERS,
  ...(v ?? {})
});
