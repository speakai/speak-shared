export enum TransactionSource {
  STRIPE = 'stripe',
  PADDLE = 'paddle',
  REVENUECAT_IOS = 'ios',
  REVENUECAT_ANDROID = 'android',
  REVENUECAT_STRIPE = 'revenuecat_stripe',
  BALANCE = 'balance',
  MANUAL = 'manual',
}

export enum TransactionType {
  SUBSCRIPTION = 'subscription',
  ONE_TIME = 'one_time',
  USAGE = 'usage',
  REFUND = 'refund',
  BALANCE_ADD = 'balance_add',
  AUTO_RELOAD = 'auto_reload',
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}
