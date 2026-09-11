export enum GenesysConnectionStatus {
  CONNECTED = 'connected',
  REVOKED = 'revoked',
  ERROR = 'error',
}

export enum GenesysPollStatus {
  OK = 'ok',
  PARTIAL = 'partial',
  FAILED = 'failed',
}

export enum GenesysHandoffStatus {
  SENT = 'sent',
  SKIPPED_NO_RECORDING = 'skipped_no_recording',
  SKIPPED_NOT_READY = 'skipped_not_ready',
  FAILED = 'failed',
}
