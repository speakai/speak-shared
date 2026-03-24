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
  TwoMonths = '2months',
  ThreeMonths = '3months',
  SixMonths = '6months',
  NineMonths = '9months',
  Yearly = 'yearly',
}
