export interface ActiveSession {
  conversationId: string;
  sessionId: string;
  agentId: string;
  agentName: string;
  startedAt: string;
  channel: "web" | "phone";
  callerPhone?: string;
}

export interface SupervisionJoinResponse {
  token: string;
  roomName: string;
  livekitUrl: string;
}
