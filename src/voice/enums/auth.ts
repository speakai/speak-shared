/**
 * Auth Enums (client-facing)
 *
 * Eligibility enums (EligibilityStatus/EligibilityReason) and the
 * SignupEligibility contract are intentionally NOT part of this public package —
 * they remain private to the API server.
 */

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
