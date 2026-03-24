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
