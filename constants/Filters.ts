export type DrawerStatusOption = 'submitted' | 'active' | 'started' | 'abandoned' | 'all';

export type FilterDrawerValues = {
  status?: DrawerStatusOption[];
  moduleId?: string;
  limit?: number;
};

export const DEFAULT_FILTERS: FilterDrawerValues = {
  status: ['submitted'],
  limit: 20,
  moduleId: undefined
};

// Small helper to guarantee presence of defaults
export const withDefaults = (v?: FilterDrawerValues): FilterDrawerValues => ({
  ...DEFAULT_FILTERS,
  ...(v ?? {})
});
