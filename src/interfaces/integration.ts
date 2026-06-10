import { IntegrationAuthType } from '../enums/index.js';

export interface CredentialFieldSpec {
  name: string;
  label: string;
  type: 'text' | 'password';
  required: boolean;
  placeholder?: string;
  helpUrl?: string;
  description?: string;
  secret?: boolean;
}

export interface ConnectFieldsResponse {
  provider: string;
  authType: IntegrationAuthType;
  fields: CredentialFieldSpec[];
}

export interface ConnectKeyRequest {
  fields: Record<string, string>;
}

export interface ConnectKeyResponse {
  status: 'connected' | 'failed';
  reason?: string;
  account?: {
    connectionId: string;
    status: string;
  };
}
