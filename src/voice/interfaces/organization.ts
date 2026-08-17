import { OrgRole } from "../enums/organization.js";
import { OrgBilling } from "../interfaces/billing.js";

export interface WorkspaceMember {
  userId: string;
  email: string;
  role: OrgRole;
  joinedAt: string;
}

export interface Workspace {
  orgId: string;
  name: string;
  slug: string;
  ownerId: string;
  members: WorkspaceMember[];
  inviteToken?: string;
  inviteTokenRole?: OrgRole;
  inviteTokenExpiresAt?: string;
  agentCount?: number; // virtual, computed in list API
  myRole?: OrgRole; // virtual, injected by API for current user
  billing?: OrgBilling;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceInvite {
  inviteId: string;
  orgId: string;
  orgName: string;
  invitedEmail: string;
  role: OrgRole;
  token: string;
  invitedByUserId: string;
  invitedByEmail: string;
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
}

export interface InvitePreview {
  orgId: string;
  orgName: string;
  role: OrgRole;
  invitedByEmail: string;
  expired: boolean;
}
