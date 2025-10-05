import { sql, SQL } from "drizzle-orm";
import { and, or, eq } from "drizzle-orm";
import { users } from "@shared/schema";

export interface RbacUser {
  id: string;
  role: string;
}

export interface RbacFilters {
  leadFilters?: SQL;
  companyFilters?: SQL;
}

/**
 * Build role-based access control filters for CRM queries
 * 
 * Admin roles (admin, super_admin, sales_manager) see all records
 * Sales roles (sales_executive, sales_rep) see only assigned/owned records
 */
export function buildRbacFilters(user: RbacUser): RbacFilters {
  const adminRoles = ['admin', 'super_admin', 'sales_manager'];
  const isAdmin = adminRoles.includes(user.role);

  if (isAdmin) {
    // Admins see everything - no filters
    return {
      leadFilters: undefined,
      companyFilters: undefined,
    };
  }

  // Sales reps see only assigned leads or leads they created
  const leadFilters = sql`assigned_to = ${user.id}`;

  // Sales reps see companies assigned to them OR companies they created
  const companyFilters = sql`(assigned_to = ${user.id} OR created_by = ${user.id})`;

  return {
    leadFilters,
    companyFilters,
  };
}

/**
 * Check if user has permission to access a specific lead
 */
export function canAccessLead(user: RbacUser, lead: { assignedTo?: string | null }): boolean {
  const adminRoles = ['admin', 'super_admin', 'sales_manager'];
  if (adminRoles.includes(user.role)) {
    return true;
  }

  return lead.assignedTo === user.id;
}

/**
 * Check if user has permission to access a specific company
 */
export function canAccessCompany(
  user: RbacUser,
  company: { assignedTo?: string | null; createdBy?: string | null }
): boolean {
  const adminRoles = ['admin', 'super_admin', 'sales_manager'];
  if (adminRoles.includes(user.role)) {
    return true;
  }

  return company.assignedTo === user.id || company.createdBy === user.id;
}

/**
 * Check if user can modify assignment (only admins can assign to others)
 */
export function canModifyAssignment(user: RbacUser): boolean {
  const adminRoles = ['admin', 'super_admin', 'sales_manager'];
  return adminRoles.includes(user.role);
}

/**
 * Get allowed assignee for a user when creating/updating records
 * - Admins can assign to anyone (or leave unassigned)
 * - Sales reps can only assign to themselves
 */
export function getAllowedAssignee(user: RbacUser, requestedAssignee?: string | null): string | null {
  const adminRoles = ['admin', 'super_admin', 'sales_manager'];
  
  if (adminRoles.includes(user.role)) {
    // Admins can assign to anyone
    return requestedAssignee ?? null;
  }

  // Sales reps can only self-assign
  return user.id;
}
