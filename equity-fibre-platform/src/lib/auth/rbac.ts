/**
 * Role-based access control. Deny-by-default: callers must explicitly assert a
 * role. Role checks are enforced on the SERVER (see requireRole in session.ts),
 * never by hiding links alone.
 */
export const STAFF_ROLES = [
  "SUPER_ADMIN",
  "OPERATIONS",
  "SUPPORT",
  "FINANCE",
  "PRIVACY_OFFICER",
  "READ_ONLY",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

/** Capability -> roles allowed. Deny-by-default for anything not listed. */
export const CAPABILITIES = {
  "dashboard.view": ["SUPER_ADMIN", "OPERATIONS", "SUPPORT", "FINANCE", "PRIVACY_OFFICER", "READ_ONLY"],
  "applications.review": ["SUPER_ADMIN", "OPERATIONS"],
  "applications.decide": ["SUPER_ADMIN", "OPERATIONS"],
  "evidence.access": ["SUPER_ADMIN", "OPERATIONS", "PRIVACY_OFFICER"],
  "provisioning.operate": ["SUPER_ADMIN", "OPERATIONS"],
  "inventory.manage": ["SUPER_ADMIN", "OPERATIONS"],
  "payments.view": ["SUPER_ADMIN", "FINANCE"],
  "payments.refund": ["SUPER_ADMIN", "FINANCE"],
  "support.handle": ["SUPER_ADMIN", "SUPPORT"],
  "knowledge.edit": ["SUPER_ADMIN", "SUPPORT"],
  "hardship.handle": ["SUPER_ADMIN", "OPERATIONS", "SUPPORT"],
  "holds.manage": ["SUPER_ADMIN", "OPERATIONS"],
  "suspension.operate": ["SUPER_ADMIN", "OPERATIONS"],
  "config.view": ["SUPER_ADMIN", "OPERATIONS", "FINANCE"],
  "config.edit": ["SUPER_ADMIN"],
  "privacy.handle": ["SUPER_ADMIN", "PRIVACY_OFFICER"],
  "audit.view": ["SUPER_ADMIN", "OPERATIONS", "PRIVACY_OFFICER", "FINANCE"],
  "demo.control": ["SUPER_ADMIN", "OPERATIONS"],
} as const satisfies Record<string, readonly StaffRole[]>;

export type Capability = keyof typeof CAPABILITIES;

export function parseRoles(roles: string): StaffRole[] {
  return roles
    .split(/\s+/)
    .map((r) => r.trim())
    .filter((r): r is StaffRole => (STAFF_ROLES as readonly string[]).includes(r));
}

export function hasCapability(roles: StaffRole[], cap: Capability): boolean {
  const allowed = CAPABILITIES[cap] as readonly StaffRole[];
  return roles.some((r) => allowed.includes(r));
}
