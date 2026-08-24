/**
 * Organization / Workspace Interfaces (client-facing)
 *
 * The nested billing block (`OrgBilling`) and Stripe identifiers (`OrgStripe`)
 * are intentionally NOT part of this public package — they remain private to
 * speak-server. `Workspace.billing` is therefore omitted here.
 */

import { OrgRole } from "../enums/organization.js";

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
