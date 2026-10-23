export type InquiryAccessRole = string | null | undefined;

export function canManageInquiry(
  userId: string,
  role: InquiryAccessRole,
  inquiry: { assignedTo?: string | null } | null | undefined,
): boolean {
  if (role === "admin" || role === "super_admin") return true;
  return !!role?.includes("sales") && !!inquiry && inquiry.assignedTo === userId;
}
