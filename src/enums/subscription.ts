export enum SubscriptionStatus {
  Active = 'active',
  Paused = 'paused',
  PendingReview = 'pendingReview',
  PendingCancellation = 'pendingCancellation',
  Cancelled = 'cancelled',
  PendingPayment = 'pendingPayment',
}

export enum SubscriptionDuration {
  Monthly = 'monthly',
  '2Months' = '2months',
  '3Months' = '3months',
  '6Months' = '6months',
  '9Months' = '9months',
  Yearly = 'yearly',
}

export enum TrialTier {
  T0 = 'T0',
  T1 = 'T1',
  T2 = 'T2',
}

/** Error codes the API returns when an offer cannot be claimed or bought. */
export enum OfferErrorCode {
  OfferEnded = 'OFFER_ENDED',
  OfferNotAvailable = 'OFFER_NOT_AVAILABLE',
  BillingPermissionRequired = 'BILLING_PERMISSION_REQUIRED',
  BotCheckFailed = 'BOT_CHECK_FAILED',
  GuestCheckoutExpired = 'GUEST_CHECKOUT_EXPIRED',
  OfferAlreadyClaimed = 'OFFER_ALREADY_CLAIMED',
  PageSignInOnly = 'OFFER_PAGE_SIGN_IN_ONLY',
  GuestCheckoutOpen = 'GUEST_CHECKOUT_OPEN',
}

/** The two ways a new visitor can claim an offer: make the account first, or pay first. */
export enum OfferFlowArm {
  AccountFirst = 'account_first',
  PayFirst = 'pay_first',
}

/** The rule for an offer page version name: lowercase letters, digits and hyphens, 1 to 40 characters. */
export const OFFER_PAGE_VERSION_PATTERN = /^[a-z0-9-]{1,40}$/;

/** The rule for an offer audience page slug: lowercase letters, digits and hyphens, 3 to 40 characters. */
export const OFFER_PAGE_SLUG_PATTERN = /^[a-z0-9-]{3,40}$/;

/** The longest each text field on an offer audience page may be, in characters. */
export const OFFER_PAGE_TEXT_LIMITS = {
  dialogTitle: 40,
  description: 120,
  cta: 32,
  continueLabel: 30,
  cardLabel: 30,
  paypalLabel: 30,
} as const;
