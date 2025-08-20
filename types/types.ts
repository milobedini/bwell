enum UserRole {
  PATIENT = 'patient',
  THERAPIST = 'therapist',
  ADMIN = 'admin'
}

enum ModuleType {
  QUESTIONNAIRE = 'questionnaire',
  EXERCISE = 'exercise',
  PSYCHO_EDUCATION = 'psychoeducation'
}

enum AccessPolicy {
  OPEN = 'open',
  ENROLLED = 'enrolled',
  ASSIGNED = 'assigned'
}

enum CanStartReason {
  OK = 'ok',
  NOT_ENROLLED = 'not_enrolled',
  REQUIRES_ASSIGNMENT = 'requires_assignment',
  UNAUTHENTICATED = 'unauthenticated'
}

enum AssignmentStatusSearchOptions {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ALL = 'all'
}

enum AssignmentStatus {
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress'
}

enum AttemptStatus {
  STARTED = 'started',
  SUBMITTED = 'submitted',
  ABANDONED = 'abandoned'
}

enum AttemptStatusInput {
  COMPLETED = 'completed',
  ACTIVE = 'active'
}

export {
  AccessPolicy,
  AssignmentStatus,
  AssignmentStatusSearchOptions,
  AttemptStatus,
  AttemptStatusInput,
  CanStartReason,
  ModuleType,
  UserRole
};
