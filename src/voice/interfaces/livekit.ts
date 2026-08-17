/**
 * LiveKit Interfaces
 */

import { LiveKitMessageType } from "../enums/livekit.js";

export interface LiveKitDataMessage {
  type: LiveKitMessageType;
  text: string;
  streaming?: boolean;
  isFinal?: boolean;
  reason?: string;
}

export interface LiveKitRoomState {
  isConnected: boolean;
  error: string | null;
}

export interface TavusConversation {
  conversation_id: string;
  conversation_name?: string;
  status: string;
  created_at?: string;
}

export interface CreateConversationParams {
  replicaId: string;
  personaId: string;
  livekitWsUrl: string;
  livekitRoomToken: string;
  conversationName?: string;
}
