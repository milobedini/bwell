import type { SeverityOption, SortOption } from '@milobedini/shared-types';

export type DrawerStatusOption = 'submitted' | 'active' | 'started' | 'abandoned' | 'all';

export type { SeverityOption, SortOption };

export type AttemptFilterDrawerValues = {
  status?: DrawerStatusOption[];
  moduleId?: string;
  limit?: number;
  // New fields for therapist attempts screen
  patientId?: string;
  severity?: SeverityOption;
};

export const DEFAULT_FILTERS: AttemptFilterDrawerValues = {
  status: ['submitted'],
  limit: 20,
  moduleId: undefined,
  patientId: undefined,
  severity: undefined
};

// Small helper to guarantee presence of defaults
export const withDefaults = (v?: AttemptFilterDrawerValues): AttemptFilterDrawerValues => ({
  ...DEFAULT_FILTERS,
  ...(v ?? {})
});
