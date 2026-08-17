export enum AuthProvider {
  EMAIL = 'email',
  GOOGLE = 'google',
  MICROSOFT = 'microsoft',
}

export enum SignupSource {
  EMAIL = 'email',
  GOOGLE = 'google',
  MICROSOFT = 'microsoft',
  INVITE = 'invite',
}

export enum EligibilityStatus {
  ELIGIBLE = 'eligible',
  BLOCKED = 'blocked',
  EXISTING_USER = 'existing_user',
}

export enum EligibilityReason {
  PERSONAL_DOMAIN = 'personal_domain',
  DISPOSABLE_DOMAIN = 'disposable_domain',
  SPAM = 'spam',
  EDUCATION_DOMAIN = 'education_domain',
  GOVERNMENT_DOMAIN = 'government_domain',
  NOT_IN_APOLLO = 'not_in_apollo',
  RATE_LIMITED = 'rate_limited',
  WRONG_PROVIDER = 'wrong_provider',
  SERVICE_UNAVAILABLE = 'service_unavailable',
}
