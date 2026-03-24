export enum TransactionSource {
  Stripe = 'stripe',
  Paddle = 'paddle',
  RevenuecatIos = 'ios',
  RevenuecatAndroid = 'android',
  RevenuecatStripe = 'revenuecat_stripe',
  Balance = 'balance',
  Manual = 'manual',
}

export enum TransactionType {
  Subscription = 'subscription',
  OneTime = 'one_time',
  Usage = 'usage',
  Refund = 'refund',
  BalanceAdd = 'balance_add',
  AutoReload = 'auto_reload',
}

export enum TransactionStatus {
  Pending = 'pending',
  Processing = 'processing',
  Succeeded = 'succeeded',
  Failed = 'failed',
  Refunded = 'refunded',
  Cancelled = 'cancelled',
}
