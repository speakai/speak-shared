/**
 * Knowledge Base Interfaces
 * Shared across backend and client
 */

export type KnowledgeBaseStatusType =
  | "pending"
  | "uploading"
  | "processing"
  | "generating-embeddings"
  | "teaching-agent"
  | "completed"
  | "failed";

/** A file in a knowledge base. Backend and API use s3Key for the object-storage key. */
export interface KnowledgeBaseFile {
  fileId: string;
  name: string;
  s3Key: string;
  url: string;
  size: number;
  type: string;
  status: string;
  region?: string;
  metadata?: Record<string, any>;
}

export interface KnowledgeBaseStatus {
  status: KnowledgeBaseStatusType;
  processingStage: string;
  progress: number;
  files: KnowledgeBaseFile[];
}
