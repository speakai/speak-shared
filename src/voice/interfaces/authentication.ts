import { EligibilityStatus, EligibilityReason, AuthProvider } from '../enums/index.js';

export type SignupEligibility =
  | { status: EligibilityStatus.ELIGIBLE; email: string; apolloContactId?: string; companyId?: string; companyName?: string }
  | { status: EligibilityStatus.BLOCKED; reason: EligibilityReason; existingProvider?: AuthProvider }
  | { status: EligibilityStatus.EXISTING_USER; skipEligibility: true };
