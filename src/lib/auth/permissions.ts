import { UserRole } from "@/types/domain";

/**
 * Pure authorization permission helpers for UI and server validation.
 * IMPORTANT: Security is enforced at the database (RLS / triggers) and Server Action level;
 * these helpers provide consistent logic across the client and server layers.
 */

export function isCaptain(role: UserRole | null | undefined): boolean {
  return role === "captain";
}

export function isViceCaptain(role: UserRole | null | undefined): boolean {
  return role === "vice_captain";
}

/**
 * Operational leadership: Captain and Vice Captain have full operational powers
 * to manage members, assign roles, alter points, and review audit history.
 */
export function isLeadership(role: UserRole | null | undefined): boolean {
  return role === "captain" || role === "vice_captain";
}

/**
 * Only Captain and Vice Captain may add, edit, or deactivate other members.
 */
export function canManageMembers(role: UserRole | null | undefined): boolean {
  return isLeadership(role);
}

/**
 * Strictly restricted: Only Captain may delete/remove a team member.
 * Vice Captain, Manager, Strategist, and Member do NOT have delete permission.
 */
export function canDeleteMember(role: UserRole | null | undefined): boolean {
  return isCaptain(role);
}

/**
 * Only Captain and Vice Captain may modify another member's points.
 */
export function canManagePoints(role: UserRole | null | undefined): boolean {
  return isLeadership(role);
}

/**
 * Only Captain and Vice Captain may change another member's role.
 */
export function canManageRoles(role: UserRole | null | undefined): boolean {
  return isLeadership(role);
}

/**
 * Captain, Vice Captain, Manager, and Strategist may view all member profiles.
 * Normal members may only view their own detailed profile.
 */
export function canViewAllProfiles(role: UserRole | null | undefined): boolean {
  return (
    role === "captain" ||
    role === "vice_captain" ||
    role === "manager" ||
    role === "strategist"
  );
}

/**
 * Captain, Vice Captain, Manager, and Strategist may view all individual weekly reports.
 * Members may only view their own individual weekly reports (and team aggregates).
 */
export function canViewAllReports(role: UserRole | null | undefined): boolean {
  return (
    role === "captain" ||
    role === "vice_captain" ||
    role === "manager" ||
    role === "strategist"
  );
}

/**
 * Only Captain and Vice Captain may view organization-wide audit logs.
 */
export function canViewAuditLogs(role: UserRole | null | undefined): boolean {
  return isLeadership(role);
}

/**
 * Only Captain may adjust core team workspace settings.
 */
export function canAccessAdminSettings(role: UserRole | null | undefined): boolean {
  return isCaptain(role);
}

export function canManageTeamSettings(role: UserRole | null | undefined): boolean {
  return isLeadership(role);
}

export function canExportTeamData(role: UserRole | null | undefined): boolean {
  return isLeadership(role);
}

/**
 * Leadership (Captain, Vice Captain, Manager, Strategist) may view team activity timeline.
 * Regular members are restricted.
 */
export function canViewActivityTimeline(role: UserRole | null | undefined): boolean {
  return (
    role === "captain" ||
    role === "vice_captain" ||
    role === "manager" ||
    role === "strategist"
  );
}

/**
 * Checks if the caller is authorized to view a specific target profile.
 */
export function canViewMemberProfile(
  callerRole: UserRole | null | undefined,
  callerId: string,
  targetId: string
): boolean {
  if (callerId === targetId) return true;
  return canViewAllProfiles(callerRole);
}
