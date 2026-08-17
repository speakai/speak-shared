/**
 * Telephony Interfaces
 */

import { PhoneNumberType, PhoneNumberStatus } from "../enums/telephony.js";

/**
 * Phone Number Entity
 */
export interface PhoneNumber {
  phoneNumberId: string;
  userId: string;
  agentId?: string;
  number: string;
  friendlyName: string;
  country: string;
  twilioPhoneNumberSid: string;
  type: PhoneNumberType;
  status: PhoneNumberStatus;
  monthlyPrice: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Available Number (from Twilio search)
 */
export interface AvailableNumber {
  number: string;
  friendlyName: string;
  country: string;
  region?: string;
  capabilities: {
    voice: boolean;
    sms: boolean;
    mms: boolean;
  };
  monthlyPrice: number;
}

/**
 * Telephony Configuration
 */
export interface TelephonyConfig {
  telephonyConfigId: string;
  userId: string;
  twilio?: {
    accountSid: string;
    authToken: string;
    isVerified: boolean;
  };
  sipTrunk?: {
    inboundTrunkId: string;
    outboundTrunkId: string;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Agent Telephony Settings
 */
export interface AgentTelephonySettings {
  enabled: boolean;
  phoneNumberId?: string;
  phoneNumber?: string;
  handoff?: {
    enabled: boolean;
    targetNumber?: string;
    summaryPrompt?: string;
  };
  sipTrunk?: {
    outboundTrunkId?: string;
  };
  settings?: {
    recordCalls?: boolean;
  };
}

/**
 * Phone Call Metadata
 */
export interface PhoneCallMetadata {
  callSid: string;
  from: string;
  to: string;
}

/**
 * Handoff Metadata
 */
export interface HandoffMetadata {
  occurred: boolean;
  targetNumber?: string;
  transferredAt?: Date | string;
  summary?: string;
}

/**
 * Telephony Usage Metrics
 */
export interface TelephonyUsage {
  provider: string;
  duration?: number;
  billedMinutes?: number;
}

/**
 * Search Numbers Parameters
 */
export interface SearchNumbersParams {
  country?: string;
  areaCode?: string;
  contains?: string;
  limit?: number;
}

/**
 * Purchase Number Request
 */
export interface PurchaseNumberRequest {
  number: string;
  friendlyName: string;
  country: string;
  agentId?: string;
}

/**
 * Verify BYOP Request
 */
export interface VerifyBYOPRequest {
  number: string;
  accountSid: string;
  authToken: string;
  friendlyName?: string;
  country?: string;
  agentId?: string;
}

/**
 * Assign Number Request
 */
export interface AssignNumberRequest {
  agentId: string;
}
