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

export { AccessPolicy, ModuleType, UserRole };
