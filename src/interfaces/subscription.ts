import { SubscriptionStatus, SubscriptionDuration } from '../enums/index';

export interface ISubscription {
  _id: string;
  planId: string;
  durationId: SubscriptionDuration;
  status: SubscriptionStatus;
  name: string;
  isActive: boolean;
  isExpired: boolean;
  isFree: boolean;
  isPaymentMethod: boolean;
  startDate: Date;
  billStartDate: Date;
  billEndDate: Date;
  remainingDays: number;
  remainingSeconds: number;
  usedMinutes: number;
  totalUsedMinutes?: number;
  freeMinutes?: number;
  freeCharacters?: number;
  freeNotes?: number;
  totalMedia?: number;
  isEnterprise?: boolean;
  notes?: {
    totalNotes: number;
    remainingNotes: number;
  };
  cost: {
    currency: string;
    total: number;
    discountedTotal: number;
    prompts: number;
    monthly: number;
    texts: number;
    insights: number;
    humanTranscription: number;
    dubbing: number;
    translation: number;
  };
  coupon: {
    id: string;
    code: string;
    percentOff: number;
    amountOff: number;
  };
  currency?: string;
  invoiceLink: string;
  offerId: string;
  regionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubscriptionPlan {
  planId: string;
  name: string;
  duration: SubscriptionDuration;
  price?: number;
}
