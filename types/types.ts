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

enum AssignmentStatus {
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress'
}

export { AccessPolicy, AssignmentStatus, CanStartReason, ModuleType, UserRole };
